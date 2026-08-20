import { IsIn } from 'class-validator';
import { CITIES } from '../constants/cities';

export class AddStopBodyDto {
  @IsIn(CITIES)
  city: string;
}
