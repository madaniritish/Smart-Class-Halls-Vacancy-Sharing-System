const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const {
    User,
    Role,
    Department,
    Building,
    Venue,
    Schedule,
    Event,
    Booking,
    Notification
} = require('./models');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/campusflow';

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('🌱 Connected to MongoDB for database foundation seeding...');

        // Clear existing collections
        await Promise.all([
            User.deleteMany({}),
            Role.deleteMany({}),
            Department.deleteMany({}),
            Building.deleteMany({}),
            Venue.deleteMany({}),
            Schedule.deleteMany({}),
            Event.deleteMany({}),
            Booking.deleteMany({}),
            Notification.deleteMany({})
        ]);
        console.log('🧹 Cleaned existing database collections.');

        // 1. Seed Roles with permission matrices
        const roles = await Role.insertMany([
            {
                roleName: 'sysadmin',
                displayName: 'System Administrator',
                description: 'Full administrative authority over users, venues, configuration, and security logs.',
                permissions: ['manage:users', 'manage:venues', 'manage:system', 'view:audit_logs', 'view:reports']
            },
            {
                roleName: 'classroom_admin',
                displayName: 'Classroom Administrator',
                description: 'Reviews, approves, or rejects classroom bookings and oversees room schedules.',
                permissions: ['approve:classroom', 'reject:classroom', 'manage:classroom_schedule', 'view:classrooms']
            },
            {
                roleName: 'seminar_admin',
                displayName: 'Seminar Hall Administrator',
                description: 'Reviews, approves, or rejects seminar hall bookings and manages event slots.',
                permissions: ['approve:seminar_hall', 'reject:seminar_hall', 'manage:seminar_schedule', 'view:seminar_halls']
            },
            {
                roleName: 'faculty',
                displayName: 'Faculty Member',
                description: 'Can reserve classrooms for regular and extra classes, submit event proposals, and view calendar.',
                permissions: ['book:classroom', 'request:extra_class', 'propose:event', 'view:calendar']
            },
            {
                roleName: 'cr',
                displayName: 'Class Representative',
                description: 'Authorized student representative able to request classroom bookings for batch needs.',
                permissions: ['book:classroom', 'propose:event', 'view:calendar']
            },
            {
                roleName: 'event_organizer',
                displayName: 'Event Organizer',
                description: 'Student or faculty club lead authorized to submit event proposals and reserve seminar halls.',
                permissions: ['book:seminar_hall', 'create:event', 'modify:event', 'cancel:event', 'view:calendar']
            }
        ]);
        console.log(`✅ Seeded ${roles.length} system roles.`);

        // 2. Seed Campus Buildings
        const buildings = await Building.insertMany([
            {
                name: 'Main Academic Complex',
                code: 'MAC-1',
                totalFloors: 4,
                description: 'Primary classroom building housing CSE and ECE lecture halls.',
                locationCoordinates: { latitude: 17.9834, longitude: 79.5312 },
                status: 'active'
            },
            {
                name: 'Auditorium & Seminar Complex',
                code: 'ASC-1',
                totalFloors: 2,
                description: 'Houses main institutional auditorium and seminar halls A & B.',
                locationCoordinates: { latitude: 17.9841, longitude: 79.5325 },
                status: 'active'
            },
            {
                name: 'Technology & AI Tower',
                code: 'TAT-1',
                totalFloors: 5,
                description: 'AI & Data Science smart classrooms and advanced computing labs.',
                locationCoordinates: { latitude: 17.9829, longitude: 79.5305 },
                status: 'active'
            }
        ]);
        console.log(`✅ Seeded ${buildings.length} campus buildings.`);

        // 3. Seed Academic Departments
        const departments = await Department.insertMany([
            {
                name: 'Computer Science and Engineering',
                code: 'CSE',
                buildingId: buildings[0]._id,
                contactEmail: 'cse_hod@campusflow.edu',
                phoneNumber: '+91 870 2459100',
                status: 'active'
            },
            {
                name: 'Electronics and Communication Engineering',
                code: 'ECE',
                buildingId: buildings[0]._id,
                contactEmail: 'ece_hod@campusflow.edu',
                phoneNumber: '+91 870 2459200',
                status: 'active'
            },
            {
                name: 'Artificial Intelligence & Data Science',
                code: 'AIDS',
                buildingId: buildings[2]._id,
                contactEmail: 'aids_hod@campusflow.edu',
                phoneNumber: '+91 870 2459300',
                status: 'active'
            },
            {
                name: 'General Campus Administration',
                code: 'General',
                buildingId: buildings[1]._id,
                contactEmail: 'admin@campusflow.edu',
                status: 'active'
            }
        ]);
        console.log(`✅ Seeded ${departments.length} academic departments.`);

        // 4. Seed Users for ALL 6 Roles with bcrypt-hashed passwords
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const users = await User.insertMany([
            {
                name: 'System Administrator',
                email: 'admin@campusflow.edu',
                username: 'admin_sys',
                password: hashedPassword,
                role: 'sysadmin',
                branch: 'General',
                designation: 'Chief IT Infrastructure Officer',
                employeeId: 'EMP-ADM-001',
                authProvider: 'local',
                status: 'active'
            },
            {
                name: 'Prof. Ramesh Rao (Classroom Admin)',
                email: 'classadmin@campusflow.edu',
                username: 'admin_classroom',
                password: hashedPassword,
                role: 'classroom_admin',
                branch: 'CSE',
                departmentId: departments[0]._id,
                designation: 'Department Space Coordinator',
                employeeId: 'EMP-CSE-104',
                authProvider: 'local',
                status: 'active'
            },
            {
                name: 'Dr. Sunita Sharma (Seminar Admin)',
                email: 'seminaradmin@campusflow.edu',
                username: 'admin_seminar',
                password: hashedPassword,
                role: 'seminar_admin',
                branch: 'General',
                departmentId: departments[3]._id,
                designation: 'Auditorium Facilities Manager',
                employeeId: 'EMP-ASC-201',
                authProvider: 'local',
                status: 'active'
            },
            {
                name: 'Dr. John Doe (Faculty)',
                email: 'faculty@campusflow.edu',
                username: 'faculty_john',
                password: hashedPassword,
                role: 'faculty',
                branch: 'CSE',
                departmentId: departments[0]._id,
                designation: 'Associate Professor',
                employeeId: 'EMP-CSE-342',
                authProvider: 'local',
                status: 'active'
            },
            {
                name: 'Mary Elizabeth (Class Representative)',
                email: 'cr@campusflow.edu',
                username: 'cr_mary',
                password: hashedPassword,
                role: 'cr',
                branch: 'CSE',
                departmentId: departments[0]._id,
                designation: '3rd Year CSE Class Representative',
                studentRollNumber: '23CSE045',
                authProvider: 'local',
                status: 'active'
            },
            {
                name: 'Alex Rivera (Event Organizer)',
                email: 'organizer@campusflow.edu',
                username: 'organizer_alex',
                password: hashedPassword,
                role: 'event_organizer',
                branch: 'General',
                designation: 'Campus Tech & Coding Club Lead',
                studentRollNumber: '22ECE089',
                authProvider: 'local',
                status: 'active'
            },
            // Example user showing Google OAuth integration
            {
                name: 'Dr. Priya Mehta (Google Auth User)',
                email: 'priya.mehta@gmail.com',
                username: 'priya_mehta',
                googleId: '109876543210987654321',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
                authProvider: 'google',
                role: 'faculty',
                branch: 'AIDS',
                departmentId: departments[2]._id,
                designation: 'Assistant Professor, AI',
                status: 'active'
            }
        ]);
        console.log(`✅ Seeded ${users.length} users across all 6 roles (all local passwords: "password123").`);

        // 5. Seed Venues (Classrooms & Seminar Halls)
        const classroomAdmin = users.find(u => u.role === 'classroom_admin')._id;
        const seminarAdmin = users.find(u => u.role === 'seminar_admin')._id;

        const venues = await Venue.insertMany([
            {
                name: 'Room 101',
                venueCode: 'MAC-101',
                type: 'classroom',
                buildingId: buildings[0]._id,
                floor: 1,
                departmentId: departments[0]._id,
                branch: 'CSE',
                capacity: 65,
                facilities: ['Projector', 'Smart Board', 'Audio System', 'AC'],
                admin_id: classroomAdmin,
                status: 'available',
                weekly_schedule: [
                    { day: 1, start_time: '09:00', end_time: '10:00', label: 'CS301 Data Structures', courseCode: 'CS301', facultyName: 'Dr. John Doe' },
                    { day: 1, start_time: '11:00', end_time: '12:00', label: 'CS302 DBMS', courseCode: 'CS302', facultyName: 'Dr. R. Sharma' }
                ]
            },
            {
                name: 'Room 102',
                venueCode: 'MAC-102',
                type: 'classroom',
                buildingId: buildings[0]._id,
                floor: 1,
                departmentId: departments[0]._id,
                branch: 'CSE',
                capacity: 50,
                facilities: ['Projector', 'Whiteboard', 'LAN'],
                admin_id: classroomAdmin,
                status: 'available'
            },
            {
                name: 'Room 201',
                venueCode: 'MAC-201',
                type: 'classroom',
                buildingId: buildings[0]._id,
                floor: 2,
                departmentId: departments[1]._id,
                branch: 'ECE',
                capacity: 70,
                facilities: ['Dual Projectors', 'Smart Board', 'AC'],
                admin_id: classroomAdmin,
                status: 'available'
            },
            {
                name: 'Room 301',
                venueCode: 'TAT-301',
                type: 'classroom',
                buildingId: buildings[2]._id,
                floor: 3,
                departmentId: departments[2]._id,
                branch: 'AIDS',
                capacity: 60,
                facilities: ['Smart Board', 'High Speed LAN', 'AC'],
                admin_id: classroomAdmin,
                status: 'available'
            },
            {
                name: 'Seminar Hall A',
                venueCode: 'ASC-SHA',
                type: 'seminar_hall',
                buildingId: buildings[1]._id,
                floor: 1,
                branch: 'General',
                capacity: 180,
                facilities: ['HD Projector', 'Cordless Mics', 'Tiered Seating', 'Surround Sound', 'AC'],
                admin_id: seminarAdmin,
                status: 'available'
            },
            {
                name: 'Main Institutional Auditorium',
                venueCode: 'ASC-AUD-MAIN',
                type: 'auditorium',
                buildingId: buildings[1]._id,
                floor: 1,
                branch: 'General',
                capacity: 650,
                facilities: ['Stage Lighting', 'Professional Audio Rig', 'VIP Green Rooms', 'Centralized AC', 'Dual 4K Projectors'],
                admin_id: seminarAdmin,
                status: 'available'
            }
        ]);
        console.log(`✅ Seeded ${venues.length} classrooms and seminar halls.`);

        // 6. Seed Sample Master Timetable Schedules
        await Schedule.insertMany([
            {
                venueId: venues[0]._id,
                departmentId: departments[0]._id,
                dayOfWeek: 1, // Monday
                startTime: '09:00',
                endTime: '10:00',
                semester: 5,
                section: 'A',
                subjectName: 'Design & Analysis of Algorithms',
                subjectCode: 'CS501',
                facultyId: users[3]._id,
                academicYear: '2025-2026',
                isActive: true
            },
            {
                venueId: venues[0]._id,
                departmentId: departments[0]._id,
                dayOfWeek: 2, // Tuesday
                startTime: '10:00',
                endTime: '11:00',
                semester: 5,
                section: 'A',
                subjectName: 'Computer Networks',
                subjectCode: 'CS502',
                facultyId: users[3]._id,
                academicYear: '2025-2026',
                isActive: true
            }
        ]);
        console.log('✅ Seeded master timetable schedules.');

        console.log('\n🎉 CampusFlow Database Foundation seeded successfully!');
        console.log('====================================================');
        console.log('Test Accounts Available (Password for all: password123):');
        console.log('1. System Admin:     admin_sys        | admin@campusflow.edu');
        console.log('2. Classroom Admin:  admin_classroom  | classadmin@campusflow.edu');
        console.log('3. Seminar Admin:    admin_seminar    | seminaradmin@campusflow.edu');
        console.log('4. Faculty:          faculty_john     | faculty@campusflow.edu');
        console.log('5. Class Rep (CR):   cr_mary          | cr@campusflow.edu');
        console.log('6. Event Organizer:  organizer_alex   | organizer@campusflow.edu');
        console.log('7. Google Auth User: priya.mehta@gmail.com (Google OAuth)');
        console.log('====================================================\n');

        process.exit(0);
    } catch (err) {
        console.error('❌ Database seeding error:', err);
        process.exit(1);
    }
};

seedDB();
