import { PaginatedResponseDto } from '../dto/pagination.dto';

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponseDto<T> {
  return new PaginatedResponseDto(data, total, page, limit);
}
