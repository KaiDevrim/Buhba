import { schemaMigrations, createTable } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      // ⚠️ Set this to a number one larger than the current schema version
      toVersion: 2,
      steps: [
        // See "Migrations API" for more details
        createTable({
          name: 'drinks',
          columns: [
            { name: 'name', type: 'string', isIndexed: true }, // indexed means that we can search the column based on the title
            { name: 'photo_url', type: 'string' },
            { name: 'rating', type: 'number', isIndexed: true },
            { name: 'price', type: 'number', isIndexed: true },
            { name: 'occasion', type: 'string', isIndexed: true },
            { name: 'store', type: 'string', isIndexed: true },
          ],
        }),
      ],
    },
  ],
})