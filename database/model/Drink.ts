import { Model } from '@nozbe/watermelondb'
import { field, text } from '@nozbe/watermelondb/decorators';

export default class Drink extends Model {
  static table = 'drinks';

  // @ts-ignore
  @text('name') name: string;
  // @ts-ignore
  @text('photo_url') photoUrl: string;
  // @ts-ignore
  @field('rating') rating: number;
  // @ts-ignore
  @field('price') price: number;
  // @ts-ignore
  @text('occasion') occasion: string;
  // @ts-ignore
  @text('store') store: string;
}