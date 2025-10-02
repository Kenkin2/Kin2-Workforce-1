import 'dotenv/config'
// TODO: add real DB connector here
async function main() {
  console.log('Seeding example data...')
  // insert org/users/jobs here
  console.log('Done.')
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
