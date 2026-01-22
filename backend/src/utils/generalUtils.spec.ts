import { camelizeKeys } from './generalUtils';

describe('generalUtils', () => {
  describe('camelizeKeys', () => {
    it('should convert snake_case keys to camelCase for an object', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        user_id: 123,
      };

      const result = camelizeKeys(input);

      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        userId: 123,
      });
    });

    it('should convert snake_case keys to camelCase for an array of objects', () => {
      const input = [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' },
      ];

      const result = camelizeKeys(input);

      expect(result).toEqual([
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' },
      ]);
    });

    it('should handle keys with multiple underscores', () => {
      const input = {
        user_first_name: 'John',
        created_at_date: '2024-01-01',
      };

      const result = camelizeKeys(input);

      expect(result).toEqual({
        userFirstName: 'John',
        createdAtDate: '2024-01-01',
      });
    });

    it('should not modify keys that are already camelCase', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = camelizeKeys(input);

      expect(result).toEqual({
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should handle empty object', () => {
      const input = {};

      const result = camelizeKeys(input);

      expect(result).toEqual({});
    });

    it('should handle empty array', () => {
      const input: Record<string, unknown>[] = [];

      const result = camelizeKeys(input);

      expect(result).toEqual([]);
    });

    it('should preserve values while converting keys', () => {
      const input = {
        is_active: true,
        item_count: 42,
        price_value: 19.99,
        tags_list: ['a', 'b'],
      };

      const result = camelizeKeys(input);

      expect(result).toEqual({
        isActive: true,
        itemCount: 42,
        priceValue: 19.99,
        tagsList: ['a', 'b'],
      });
    });
  });
});
