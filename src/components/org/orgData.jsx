// Static seed data for Machias + AOS 96 org structure
// Used to initialize the database on first load

export const MACHIAS_ORG_SEED = [
  // ── ROOT ─────────────────────────────────────────────────────────────────
  { _key: 'root',           name: 'Residents / Voters',          node_type: 'governance_body',    branch: 'root',    parent_id: null,          sort_order: 0,  description: 'The ultimate authority in Machias — all governance derives from the residents and voters of the Town.' },

  // ── MUNICIPAL BRANCH ──────────────────────────────────────────────────────
  { _key: 'select_board',   name: 'Select Board',                node_type: 'governance_body',    branch: 'municipal', parent_id: 'root',      sort_order: 1,  description: 'Five-member elected body; sets policy, approves budget, and appoints Town Manager.' },
  { _key: 'town_mgr',       name: 'Town Manager',                node_type: 'executive_leadership', branch: 'municipal', parent_id: 'select_board', sort_order: 1, description: 'Chief administrative officer. Implements Select Board policy, supervises all municipal departments.' },

  // Departments under Town Manager
  { _key: 'finance_hr',     name: 'Finance & Human Resources',   node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 1,  description: 'Financial management, budgeting, payroll, HR administration, grants management.', budget_link: 'General Fund — Administration' },
  { _key: 'town_clerk',     name: 'Town Clerk Office',           node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 2,  description: 'Records, elections, licenses, vital statistics, and public information.' },
  { _key: 'police',         name: 'Police Department',           node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 3,  description: 'Law enforcement, public safety, emergency dispatch coordination.', budget_link: 'General Fund — Public Safety' },
  { _key: 'fire',           name: 'Fire Department',             node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 4,  description: 'Fire suppression, fire prevention, hazmat response. Primarily volunteer force.', budget_link: 'General Fund — Fire' },
  { _key: 'ambulance',      name: 'Ambulance Department',        node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 5,  description: 'Emergency medical services for Machias and surrounding region. ~1,648 transports/yr.', budget_link: 'Ambulance Enterprise Fund' },
  { _key: 'public_works',   name: 'Public Works',                node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 6,  description: 'Roads, infrastructure maintenance, snow removal, vehicle fleet management.', budget_link: 'General Fund — Public Works' },
  { _key: 'wastewater',     name: 'Wastewater Department',       node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 7,  description: 'Wastewater treatment and sewer system operations.', budget_link: 'Sewer Enterprise Fund' },
  { _key: 'transfer_stn',   name: 'Transfer Station',            node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 8,  description: 'Solid waste management and recycling operations. Serves Machias and regional member towns.', budget_link: 'Transfer Station Enterprise Fund' },
  { _key: 'parks_rec',      name: 'Parks & Recreation',          node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 9,  description: 'Public parks, recreational programming, community events.' },
  { _key: 'airport',        name: 'Airport Administration',      node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 10, description: 'Machias Valley Airport operations, FAA compliance, hangar leases.' },
  { _key: 'planning',       name: 'Planning & Development',      node_type: 'department',         branch: 'municipal', parent_id: 'town_mgr',  sort_order: 11, description: 'Comprehensive planning, zoning, permitting, economic development.' },

  // Roles under Finance & HR
  { _key: 'finance_dir',    name: 'Finance Director / Asst. HR Director', node_type: 'staff_role', branch: 'municipal', parent_id: 'finance_hr', sort_order: 1, description: 'Manages all municipal financial operations, budget preparation, payroll, and HR administration.', restructuring_status: 'proposed_change', restructuring_notes: 'Restructuring will free 45–60% of FD time from transactional tasks by adding Staff Accountant and Billing Specialist. Long-term role evolves toward strategic financial management.' },
  { _key: 'sa_role',        name: 'Staff Accountant',            node_type: 'staff_role',         branch: 'municipal', parent_id: 'finance_hr', sort_order: 2,  description: 'AP/AR processing, payroll, bank reconciliation, grant financial reporting, audit prep.', restructuring_status: 'proposed_new', restructuring_notes: 'Phase 1 new hire. Resolves separation-of-duties deficiency. Funded by General Fund.' },
  { _key: 'bs_role',        name: 'Billing Specialist',          node_type: 'staff_role',         branch: 'municipal', parent_id: 'finance_hr', sort_order: 3,  description: 'In-house EMS billing, AR management, external municipal billing services.', restructuring_status: 'proposed_new', restructuring_notes: 'Phase 1 new hire (Month 7). Replaces Comstar contract. Funded by Ambulance Enterprise Fund.' },
  { _key: 'ga_role',        name: 'GA Coordinator',              node_type: 'staff_role',         branch: 'municipal', parent_id: 'finance_hr', sort_order: 4,  description: 'General Assistance program administration, grant tracking, federal/state compliance.', restructuring_status: 'proposed_new', restructuring_notes: 'Phase 1 stipend position (Month 9). Frees TM time from GA and grant administration.' },
  { _key: 'rc_role',        name: 'Revenue Coordinator',         node_type: 'staff_role',         branch: 'municipal', parent_id: 'finance_hr', sort_order: 5,  description: 'Manages regional services contracts and relationships with member municipalities.', restructuring_status: 'proposed_new', restructuring_notes: 'Trigger-based hire Year 3 — only when regional revenue covers fully loaded cost.' },

  // Roles under Police
  { _key: 'police_chief',   name: 'Chief of Police',             node_type: 'staff_role',         branch: 'municipal', parent_id: 'police',    sort_order: 1 },
  { _key: 'police_admin',   name: 'Police Administrative Staff', node_type: 'staff_role',         branch: 'municipal', parent_id: 'police',    sort_order: 2, staff_count: 2 },
  { _key: 'officers',       name: 'Police Officers',             node_type: 'staff_role',         branch: 'municipal', parent_id: 'police',    sort_order: 3, staff_count: 6 },

  // Roles under Fire
  { _key: 'fire_chief',     name: 'Fire Chief',                  node_type: 'staff_role',         branch: 'municipal', parent_id: 'fire',      sort_order: 1 },
  { _key: 'firefighters',   name: 'Volunteer Firefighters',      node_type: 'staff_role',         branch: 'municipal', parent_id: 'fire',      sort_order: 2, staff_count: 20 },

  // Roles under Ambulance
  { _key: 'amb_chief',      name: 'Ambulance Chief',             node_type: 'staff_role',         branch: 'municipal', parent_id: 'ambulance', sort_order: 1 },
  { _key: 'ems_personnel',  name: 'EMS Personnel',               node_type: 'staff_role',         branch: 'municipal', parent_id: 'ambulance', sort_order: 2, staff_count: 12 },

  // Roles under Public Works
  { _key: 'pw_dir',         name: 'Public Works Director',       node_type: 'staff_role',         branch: 'municipal', parent_id: 'public_works', sort_order: 1 },
  { _key: 'hw_crew',        name: 'Highway Crew',                node_type: 'staff_role',         branch: 'municipal', parent_id: 'public_works', sort_order: 2, staff_count: 4 },

  // Boards and Committees (advisory, connect to Select Board)
  { _key: 'planning_board', name: 'Planning Board',              node_type: 'board_committee',    branch: 'municipal', parent_id: 'select_board', sort_order: 10, is_advisory: true, description: 'Reviews land use applications, comprehensive planning, and zoning amendments.' },
  { _key: 'appeals_board',  name: 'Board of Appeals',            node_type: 'board_committee',    branch: 'municipal', parent_id: 'select_board', sort_order: 11, is_advisory: true, description: 'Hears appeals of administrative decisions on zoning and permits.' },
  { _key: 'budget_comm',    name: 'Budget Committee',            node_type: 'board_committee',    branch: 'municipal', parent_id: 'select_board', sort_order: 12, is_advisory: true, description: 'Reviews and recommends annual budget to Select Board and Town Meeting.' },
  { _key: 'airport_comm',   name: 'Airport Committee',           node_type: 'board_committee',    branch: 'municipal', parent_id: 'select_board', sort_order: 13, is_advisory: true, description: 'Advisory body for airport planning and policy.' },
  { _key: 'rec_comm',       name: 'Recreation Committee',        node_type: 'board_committee',    branch: 'municipal', parent_id: 'select_board', sort_order: 14, is_advisory: true },
  { _key: 'comp_comm',      name: 'Comprehensive Plan Committee', node_type: 'board_committee',   branch: 'municipal', parent_id: 'select_board', sort_order: 15, is_advisory: true },

  // ── SCHOOL GOVERNANCE BRANCH ──────────────────────────────────────────────
  { _key: 'school_comm',    name: 'School Committee (AOS 96)',   node_type: 'governance_body',    branch: 'school',   parent_id: 'root',        sort_order: 2,  description: 'Elected school committee for AOS 96 — the member school districts including Machias. Sets education policy, approves school budget.' },
  { _key: 'superintendent', name: 'Superintendent',              node_type: 'executive_leadership', branch: 'school', parent_id: 'school_comm', sort_order: 1,  description: 'Chief executive of AOS 96 school district. Oversees all schools within the administrative unit.', staff_name: 'Nicole Case' },

  // District Administration
  { _key: 'dist_admin',     name: 'District Administration',     node_type: 'division',           branch: 'school',   parent_id: 'superintendent', sort_order: 1, description: 'Central office administration supporting all schools in AOS 96.' },
  { _key: 'curriculum',     name: 'Curriculum Coordinator',      node_type: 'staff_role',         branch: 'school',   parent_id: 'dist_admin',  sort_order: 1,  description: 'Coordinates K–12 curriculum alignment, instructional coaching, and assessment.' },
  { _key: 'sped_dir',       name: 'Special Education Director',  node_type: 'staff_role',         branch: 'school',   parent_id: 'dist_admin',  sort_order: 2,  description: 'Oversees all special education services and IEP compliance across AOS 96.' },

  // Machias Memorial High School
  { _key: 'mmhs',           name: 'Machias Memorial High School', node_type: 'school',            branch: 'school',   parent_id: 'superintendent', sort_order: 2, description: 'Grades 9–12. Serves Machias and surrounding communities.' },
  { _key: 'mmhs_principal', name: 'Principal',                   node_type: 'staff_role',         branch: 'school',   parent_id: 'mmhs',        sort_order: 1,  staff_name: 'Wendy Black' },
  { _key: 'mmhs_faculty',   name: 'Faculty & Staff',             node_type: 'division',           branch: 'school',   parent_id: 'mmhs',        sort_order: 2 },
  { _key: 'mmhs_teachers',  name: 'Classroom Teachers',          node_type: 'staff_role',         branch: 'school',   parent_id: 'mmhs_faculty', sort_order: 1, staff_count: 20 },
  { _key: 'mmhs_specialists', name: 'Specialists',               node_type: 'staff_role',         branch: 'school',   parent_id: 'mmhs_faculty', sort_order: 2, description: 'Art, music, PE, library, technology.' },
  { _key: 'mmhs_sped',      name: 'Special Education',           node_type: 'program',            branch: 'school',   parent_id: 'mmhs_faculty', sort_order: 3 },
  { _key: 'mmhs_title1',    name: 'Title I Program',             node_type: 'program',            branch: 'school',   parent_id: 'mmhs_faculty', sort_order: 4 },
  { _key: 'mmhs_edtech',    name: 'Educational Technicians',     node_type: 'staff_role',         branch: 'school',   parent_id: 'mmhs_faculty', sort_order: 5 },
  { _key: 'mmhs_counsel',   name: 'Counseling & Student Services', node_type: 'division',         branch: 'school',   parent_id: 'mmhs',        sort_order: 3 },
  { _key: 'mmhs_support',   name: 'Support Services',            node_type: 'support_services',   branch: 'school',   parent_id: 'mmhs',        sort_order: 4 },
  { _key: 'mmhs_trans',     name: 'Transportation',              node_type: 'support_services',   branch: 'school',   parent_id: 'mmhs_support', sort_order: 1 },
  { _key: 'mmhs_facilities', name: 'Facilities',                 node_type: 'support_services',   branch: 'school',   parent_id: 'mmhs_support', sort_order: 2 },
  { _key: 'mmhs_food',      name: 'Food Services',               node_type: 'support_services',   branch: 'school',   parent_id: 'mmhs_support', sort_order: 3 },
  { _key: 'mmhs_custodial', name: 'Custodial Services',          node_type: 'support_services',   branch: 'school',   parent_id: 'mmhs_support', sort_order: 4 },

  // Rose M. Gaffney Elementary
  { _key: 'rmg',            name: 'Rose M. Gaffney Elementary',  node_type: 'school',             branch: 'school',   parent_id: 'superintendent', sort_order: 3, description: 'Pre-K through Grade 8.' },
  { _key: 'rmg_principal',  name: 'Principal',                   node_type: 'staff_role',         branch: 'school',   parent_id: 'rmg',         sort_order: 1,  staff_name: 'Sue Dow' },
  { _key: 'rmg_ap',         name: 'Assistant Principal',         node_type: 'staff_role',         branch: 'school',   parent_id: 'rmg',         sort_order: 2,  staff_name: 'Chad Fitzsimmons' },
  { _key: 'rmg_admin',      name: 'Administration',              node_type: 'division',           branch: 'school',   parent_id: 'rmg',         sort_order: 3 },
  { _key: 'rmg_counsel',    name: 'Counseling & Student Services', node_type: 'division',         branch: 'school',   parent_id: 'rmg',         sort_order: 4 },
  { _key: 'rmg_teachers',   name: 'Classroom Teachers',          node_type: 'staff_role',         branch: 'school',   parent_id: 'rmg',         sort_order: 5,  staff_count: 24 },
  { _key: 'rmg_specialists', name: 'Specialists',                node_type: 'staff_role',         branch: 'school',   parent_id: 'rmg',         sort_order: 6 },
  { _key: 'rmg_sped',       name: 'Special Education',           node_type: 'program',            branch: 'school',   parent_id: 'rmg',         sort_order: 7 },
  { _key: 'rmg_title1',     name: 'Title I Program',             node_type: 'program',            branch: 'school',   parent_id: 'rmg',         sort_order: 8 },
  { _key: 'rmg_edtech',     name: 'Educational Technicians',     node_type: 'staff_role',         branch: 'school',   parent_id: 'rmg',         sort_order: 9 },
  { _key: 'rmg_support',    name: 'Support Services',            node_type: 'support_services',   branch: 'school',   parent_id: 'rmg',         sort_order: 10 },
  { _key: 'rmg_trans',      name: 'Transportation',              node_type: 'support_services',   branch: 'school',   parent_id: 'rmg_support', sort_order: 1 },
  { _key: 'rmg_facilities', name: 'Facilities',                  node_type: 'support_services',   branch: 'school',   parent_id: 'rmg_support', sort_order: 2 },
  { _key: 'rmg_food',       name: 'Food Services',               node_type: 'support_services',   branch: 'school',   parent_id: 'rmg_support', sort_order: 3 },
  { _key: 'rmg_custodial',  name: 'Custodial Services',          node_type: 'support_services',   branch: 'school',   parent_id: 'rmg_support', sort_order: 4 },
];