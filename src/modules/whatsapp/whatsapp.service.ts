import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/database/prisma.service';
import { WhatsappRepository } from './whatsapp.repository';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

enum WaState {
  MAIN_MENU = 'MAIN_MENU',
  AUTH_PIN = 'AUTH_PIN',
  QUERY_TYPE = 'QUERY_TYPE',
  SEARCH_TERM = 'SEARCH_TERM',
  RESULTS = 'RESULTS',
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly whapiUrl: string;
  private readonly whapiToken: string;
  private readonly SESSION_TTL_HOURS = 4;

  constructor(
    private readonly whatsappRepository: WhatsappRepository,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.whapiUrl = this.configService.get<string>('WHAPI_URL', 'https://gate.whapi.cloud');
    this.whapiToken = this.configService.get<string>('WHAPI_TOKEN', '');
  }

  async handleWebhook(payload: any) {
    if (!payload?.messages?.length) {
      return { status: 'no_messages' };
    }

    for (const message of payload.messages) {
      if (message.from_me) continue;

      const phoneNumber = message.chat_id?.replace('@s.whatsapp.net', '') || message.from;
      const text = message.text?.body || message.body || '';

      await this.processMessage(phoneNumber, text);
    }

    return { status: 'processed' };
  }

  private async processMessage(phoneNumber: string, text: string) {
    // Clean expired sessions
    await this.whatsappRepository.deleteExpiredSessions();

    // Get or create session
    let session: any = await this.whatsappRepository.findSession(phoneNumber);

    if (!session) {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + this.SESSION_TTL_HOURS);

      session = await this.whatsappRepository.createSession({
        phoneNumber,
        expiresAt,
      });
    }

    const normalizedText = text.trim().toLowerCase();

    // Handle /help or /start commands
    if (normalizedText === '/help' || normalizedText === '/start' || normalizedText === 'hi') {
      await this.whatsappRepository.updateSession(session.id, {
        state: 'MAIN_MENU',
      });
      await this.sendMessage(phoneNumber, this.getMainMenu());
      return;
    }

    // Handle /cancel
    if (normalizedText === '/cancel') {
      await this.whatsappRepository.updateSession(session.id, {
        state: 'MAIN_MENU',
        selectedQueryType: null,
        searchTerm: null,
      });
      await this.sendMessage(phoneNumber, 'Session cancelled. Send /start for the main menu.');
      return;
    }

    try {
      switch (session.state) {
        case 'MAIN_MENU':
          await this.handleMainMenu(session, phoneNumber, normalizedText);
          break;
        case 'AUTH_PIN':
          await this.handleAuthPin(session, phoneNumber, text);
          break;
        case 'QUERY_TYPE':
          await this.handleQueryType(session, phoneNumber, normalizedText);
          break;
        case 'SEARCH_TERM':
          await this.handleSearchTerm(session, phoneNumber, text);
          break;
        default:
          await this.whatsappRepository.updateSession(session.id, { state: 'MAIN_MENU' });
          await this.sendMessage(phoneNumber, this.getMainMenu());
      }
    } catch (err: any) {
      this.logger.error(`WhatsApp error for ${phoneNumber}: ${err.message}`);
      await this.sendMessage(
        phoneNumber,
        'An error occurred. Send /start to try again.',
      );
    }
  }

  private async handleMainMenu(session: any, phoneNumber: string, text: string) {
    // Check if phone is registered
    const officer = await this.prisma.officer.findFirst({
      where: {
        OR: [
          { ussdPhoneNumber: phoneNumber },
          { phone: { contains: phoneNumber } },
        ],
        active: true,
      },
    });

    if (officer) {
      await this.whatsappRepository.updateSession(session.id, {
        officerId: officer.id,
        state: 'QUERY_TYPE',
      });
      await this.sendMessage(
        phoneNumber,
        `Welcome ${officer.name}! CRMS Field Query Tool\n\nSelect a query:\n1. Wanted Person Check\n2. Missing Person Check\n3. Background Check (NIN)\n4. Vehicle Check\n\nReply with the number.`,
      );
    } else {
      await this.whatsappRepository.updateSession(session.id, { state: 'AUTH_PIN' });
      await this.sendMessage(
        phoneNumber,
        'CRMS Field Query Tool\n\nYour phone is not registered. Enter your badge number to authenticate:',
      );
    }
  }

  private async handleAuthPin(session: any, phoneNumber: string, badge: string) {
    const officer = await this.prisma.officer.findFirst({
      where: { badge: badge.trim().toUpperCase(), active: true },
    });

    if (!officer) {
      const attempts = (session.pinAttempts || 0) + 1;
      if (attempts >= 3) {
        await this.whatsappRepository.deleteSession(session.id);
        await this.sendMessage(phoneNumber, 'Too many failed attempts. Session ended.');
        return;
      }
      await this.whatsappRepository.updateSession(session.id, { pinAttempts: attempts });
      await this.sendMessage(phoneNumber, `Badge not found. Try again (${3 - attempts} attempts left):`);
      return;
    }

    await this.whatsappRepository.updateSession(session.id, {
      officerId: officer.id,
      state: 'QUERY_TYPE',
      pinAttempts: 0,
    });

    await this.sendMessage(
      phoneNumber,
      `Authenticated as ${officer.name}\n\nSelect a query:\n1. Wanted Person Check\n2. Missing Person Check\n3. Background Check (NIN)\n4. Vehicle Check\n\nReply with the number.`,
    );
  }

  private async handleQueryType(session: any, phoneNumber: string, text: string) {
    const types: Record<string, string> = {
      '1': 'wanted',
      '2': 'missing',
      '3': 'background',
      '4': 'vehicle',
    };

    const queryType = types[text];
    if (!queryType) {
      await this.sendMessage(
        phoneNumber,
        'Invalid selection. Reply with:\n1. Wanted\n2. Missing\n3. Background\n4. Vehicle',
      );
      return;
    }

    await this.whatsappRepository.updateSession(session.id, {
      selectedQueryType: queryType,
      state: 'SEARCH_TERM',
    });

    const prompts: Record<string, string> = {
      wanted: 'Enter person name or NIN to search:',
      missing: 'Enter name to search missing persons:',
      background: 'Enter NIN for background check:',
      vehicle: 'Enter license plate number:',
    };

    await this.sendMessage(phoneNumber, prompts[queryType]);
  }

  private async handleSearchTerm(session: any, phoneNumber: string, term: string) {
    const queryType = session.selectedQueryType;
    let result: string;

    switch (queryType) {
      case 'wanted':
        result = await this.queryWanted(term);
        break;
      case 'missing':
        result = await this.queryMissing(term);
        break;
      case 'background':
        result = await this.queryBackground(term);
        break;
      case 'vehicle':
        result = await this.queryVehicle(term);
        break;
      default:
        result = 'Unknown query type.';
    }

    await this.sendMessage(phoneNumber, result + '\n\nSend /start for a new query.');

    // Reset to main menu
    await this.whatsappRepository.updateSession(session.id, {
      state: 'MAIN_MENU',
      selectedQueryType: null,
      searchTerm: null,
    });
  }

  private async queryWanted(term: string): Promise<string> {
    const results = await this.prisma.wantedPerson.findMany({
      where: {
        status: 'active',
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { person: { nationalId: term } },
        ],
      },
      take: 5,
      select: { name: true, charges: true, dangerLevel: true, lastSeenLocation: true },
    });

    if (results.length === 0) return 'No active wanted person records found.';

    return '*Wanted Person Results*\n\n' +
      results.map((r, i) =>
        `${i + 1}. *${r.name}*\nCharges: ${r.charges.join(', ')}\nDanger Level: ${r.dangerLevel}\nLast Seen: ${r.lastSeenLocation || 'Unknown'}`,
      ).join('\n\n');
  }

  private async queryMissing(term: string): Promise<string> {
    const results = await this.prisma.amberAlert.findMany({
      where: {
        status: 'active',
        personName: { contains: term, mode: 'insensitive' },
      },
      take: 5,
      select: { personName: true, age: true, lastSeenLocation: true, contactPhone: true },
    });

    if (results.length === 0) return 'No active missing person alerts found.';

    return '*Missing Person Results*\n\n' +
      results.map((r, i) =>
        `${i + 1}. *${r.personName}*${r.age ? ` (Age: ${r.age})` : ''}\nLast Seen: ${r.lastSeenLocation || 'Unknown'}\nContact: ${r.contactPhone}`,
      ).join('\n\n');
  }

  private async queryBackground(nin: string): Promise<string> {
    const person = await this.prisma.person.findUnique({
      where: { nationalId: nin.trim() },
      select: {
        firstName: true,
        lastName: true,
        isWanted: true,
        cases: { select: { role: true } },
      },
    });

    if (!person) return `NIN: ${nin}\n*Status: CLEAR*\nNo records found.`;

    if (person.isWanted) {
      return `NIN: ${nin}\nName: ${person.firstName} ${person.lastName}\n*Status: WANTED*\nCases: ${person.cases.length}\n\n⚠️ This person is WANTED.`;
    }

    if (person.cases.length > 0) {
      return `NIN: ${nin}\nName: ${person.firstName} ${person.lastName}\n*Status: RECORD EXISTS*\nCases: ${person.cases.length}\n\nVisit station for details.`;
    }

    return `NIN: ${nin}\nName: ${person.firstName} ${person.lastName}\n*Status: CLEAR*`;
  }

  private async queryVehicle(plate: string): Promise<string> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { licensePlate: plate.trim().toUpperCase() },
      select: {
        licensePlate: true,
        vehicleType: true,
        make: true,
        model: true,
        color: true,
        status: true,
        ownerName: true,
      },
    });

    if (!vehicle) return `Plate: ${plate.toUpperCase()}\nNo records found.`;

    const desc = [vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(' ');
    let result = `*Vehicle: ${vehicle.licensePlate}*\nType: ${vehicle.vehicleType}\n${desc ? `Details: ${desc}\n` : ''}Status: ${vehicle.status.toUpperCase()}`;

    if (vehicle.status === 'stolen') {
      result += '\n\n🚨 *ALERT: This vehicle is reported STOLEN!*';
    }

    return result;
  }

  private async sendMessage(to: string, body: string) {
    if (!this.whapiToken) {
      this.logger.warn('WHAPI_TOKEN not configured — message not sent');
      return;
    }

    try {
      const chatId = to.includes('@') ? to : `${to}@s.whatsapp.net`;
      await fetch(`${this.whapiUrl}/messages/text`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.whapiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: chatId, body }),
      });
    } catch (err: any) {
      this.logger.error(`Failed to send WhatsApp message to ${to}: ${err.message}`);
    }
  }

  private getMainMenu(): string {
    return `*CRMS Field Query Tool* 🔍\n\nWelcome! Available commands:\n\n1. Wanted Person Check\n2. Missing Person Check\n3. Background Check (NIN)\n4. Vehicle Check\n\n/help - Show this menu\n/cancel - Cancel current query\n\nReply with a number to start.`;
  }

  // ==================== Newsletter Management ====================

  async findAllNewsletters(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.whatsappRepository.findAllNewsletters(skip, limit),
      this.whatsappRepository.countNewsletters(),
    ]);
    return new PaginatedResponseDto(data, total, page, limit);
  }

  async createNewsletter(
    data: {
      channelId: string;
      name: string;
      description?: string;
      pictureUrl?: string;
    },
    officerId: string,
  ) {
    return this.whatsappRepository.createNewsletter({
      ...data,
      createdById: officerId,
    });
  }

  async updateNewsletter(id: string, data: Record<string, any>) {
    const existing = await this.whatsappRepository.findNewsletterById(id);
    if (!existing) {
      throw new NotFoundException(`Newsletter not found: ${id}`);
    }
    return this.whatsappRepository.updateNewsletter(id, data);
  }

  async broadcastNewsletter(id: string, message: string) {
    const newsletter = await this.whatsappRepository.findNewsletterById(id);
    if (!newsletter) {
      throw new NotFoundException(`Newsletter not found: ${id}`);
    }

    if (!this.whapiToken) {
      this.logger.warn('WHAPI_TOKEN not configured — broadcast not sent');
      return { sent: false, reason: 'WHAPI_TOKEN not configured' };
    }

    try {
      await fetch(`${this.whapiUrl}/newsletters/${newsletter.channelId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.whapiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body: message }),
      });

      return { sent: true, channelId: newsletter.channelId };
    } catch (err: any) {
      this.logger.error(`Broadcast failed: ${err.message}`);
      return { sent: false, error: err.message };
    }
  }
}
