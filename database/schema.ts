import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
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
  ]
})