import {
    Document,
    Model,
    QueryFilter,
    QueryOptions,
    UpdateQuery,
} from 'mongoose';

export abstract class BaseRepository<T extends Document> {
  constructor(private readonly model: Model<T>) {}

  async create(doc: any): Promise<T> {
    return this.model.create(doc);
  }

  async findOne(
    filterQuery: QueryFilter<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findOne(filterQuery, undefined, options);
  }

  async find(
    filterQuery: QueryFilter<T>,
    options?: QueryOptions<T>,
  ): Promise<T[]> {
    return this.model.find(filterQuery, undefined, options);
  }

  async updateOne(
    filterQuery: QueryFilter<T>,
    updateQuery: UpdateQuery<T>,
    options?: QueryOptions<T>,
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filterQuery, updateQuery, {
      ...options,
      returnDocument: 'after',
    });
  }

  async deleteOne(filterQuery: QueryFilter<T>): Promise<boolean> {
    const result = await this.model.deleteOne(filterQuery);
    return result.deletedCount === 1;
  }
}
