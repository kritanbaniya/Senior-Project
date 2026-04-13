import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Keep these metadata keys exactly aligned with your app/database setup:
 * - role
 * - full_name
 *
 * The trigger should read these and create the matching row in public.profiles.
 */
const users = [
  {
    email: 'acerman_11@icloud.com',
    password: 'abc123',
    full_name: 'Jordan Martinez',
    role: 'patient',
  },
  {
    email: 'spittle.trickle-0r@icloud.com',
    password: 'abc123',
    full_name: 'Miriam Moskowitz',
    role: 'nurse',
  },
  {
    email: 'recalls-wives6v@icloud.com',
    password: 'abc123',
    full_name: 'Amina Shah',
    role: 'doctor',
  },
  {
    email: 'wear_gratin_5p@icloud.com',
    password: 'abc123',
    full_name: 'Victor Han',
    role: 'clinic',
  },
]

async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    throw error
  }

  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null
}

async function ensureUser(userDef) {
  const existing = await findUserByEmail(userDef.email)

  if (existing) {
    console.log(`Skipping existing user: ${userDef.email} -> ${existing.id}`)
    return existing
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: userDef.email,
    password: userDef.password,
    email_confirm: true,
    user_metadata: {
      role: userDef.role,
      full_name: userDef.full_name,
    },
  })

  if (error) {
    throw error
  }

  console.log(`Created user: ${userDef.email} -> ${data.user.id}`)
  return data.user
}

async function main() {
  const createdUsers = []

  for (const userDef of users) {
    const user = await ensureUser(userDef)
    createdUsers.push({
      email: user.email,
      id: user.id,
      role: userDef.role,
      full_name: userDef.full_name,
    })
  }

  console.log('\nUser summary:')
  for (const user of createdUsers) {
    console.log(
      `${user.role.padEnd(12)} ${user.email.padEnd(28)} ${user.id} ${user.full_name}`
    )
  }
}

main().catch((error) => {
  console.error('Failed to seed auth users:')
  console.error(error)
  process.exit(1)
})