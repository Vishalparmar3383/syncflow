import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Starting seed with adapter...')
  try {
    // 1. Create Academic Year
    const academicYear = await prisma.acd_academic_year.upsert({
      where: { academic_year_code: 'AY2025-26' },
      update: {},
      create: {
        academic_year_code: 'AY2025-26',
        start_date: new Date('2025-01-01'),
        end_date: new Date('2026-01-01'),
        is_active: true,
        description: 'Academic Year 2025-2026',
      },
    })
    console.log('Academic year created:', academicYear.academic_year_code)

    // 2. Create Department
    const department = await prisma.acd_department.upsert({
      where: { department_name: 'Computer Science' },
      update: {},
      create: {
        department_name: 'Computer Science',
        department_code: 'CS',
        description: 'Department of Computer Science and Engineering',
      },
    })
    console.log('Department created:', department.department_name)
    
    // 2.5 Create Project Types
    const projectTypes = [
      { name: 'Major', desc: 'Major Project / Dissertation' },
      { name: 'Minor', desc: 'Minor Project / Mini Project' },
      { name: 'Research', desc: 'Research Project / Paper' },
    ]

    for (const type of projectTypes) {
      await prisma.acd_project_type.upsert({
        where: { project_type_name: type.name },
        update: { description: type.desc },
        create: {
          project_type_name: type.name,
          description: type.desc
        }
      })
    }
    console.log('Project types seeded.')

    // 3. Create Admin User
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10)
    const adminUser = await prisma.acd_user.upsert({
      where: { email: 'admin@syncflow.com' },
      update: {},
      create: {
        email: 'admin@syncflow.com',
        password_hash: adminPasswordHash,
        role: 'Admin',
        acd_admin: {
          create: {
            admin_name: 'System Administrator',
            email: 'admin@syncflow.com',
          },
        },
      },
    })
    console.log('Admin user created:', adminUser.email)

    // 4. Create Faculty Users
    const facultyData = [
      { name: 'Dr. Jane Smith', email: 'faculty@syncflow.com', desig: 'Associate Professor' },
      { name: 'Dr. Robert Miller', email: 'robert@syncflow.com', desig: 'Professor' },
      { name: 'Dr. Sarah Connor', email: 'sarah@syncflow.com', desig: 'Assistant Professor' },
    ]

    for (const f of facultyData) {
      const passHash = await bcrypt.hash('Faculty@123', 10)
      await prisma.acd_user.upsert({
        where: { email: f.email },
        update: {},
        create: {
          email: f.email,
          password_hash: passHash,
          role: 'Faculty',
          acd_staff: {
            create: {
              staff_name: f.name,
              email: f.email,
              department_id: department.department_id,
              designation: f.desig,
            },
          },
        },
      })
      console.log('Faculty user synced:', f.email)
    }

    // 5. Create Student Users
    const studentData = [
      { name: 'Alice Cooper', email: 'student@syncflow.com', enroll: 'STUD001', cgpa: 3.8 },
      { name: 'Bob Smith', email: 'bob@syncflow.com', enroll: 'STUD002', cgpa: 3.5 },
      { name: 'Charlie Brown', email: 'charlie@syncflow.com', enroll: 'STUD003', cgpa: 3.2 },
      { name: 'Diana Prince', email: 'diana@syncflow.com', enroll: 'STUD004', cgpa: 3.9 },
      { name: 'Ethan Hunt', email: 'ethan@syncflow.com', enroll: 'STUD005', cgpa: 3.7 },
    ]

    for (const s of studentData) {
      const passHash = await bcrypt.hash('Student@123', 10)
      await prisma.acd_user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          email: s.email,
          password_hash: passHash,
          role: 'Student',
          acd_student: {
            create: {
              student_name: s.name,
              email: s.email,
              enrollment_number: s.enroll,
              department_id: department.department_id,
              academic_year_id: academicYear.academic_year_id,
              cgpa: s.cgpa,
            },
          },
        },
      })
      console.log('Student user synced:', s.email)
    }

    console.log('Seed completed successfully.')
  } catch (error) {
    console.error('Seed error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
