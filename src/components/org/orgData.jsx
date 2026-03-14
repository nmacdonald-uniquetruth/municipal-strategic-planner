// Static seed data for Machias + AOS 96 org structure
// Used to initialize the database on first load

export const MACHIAS_ORG_SEED = [

  // ── ROOT ──────────────────────────────────────────────────────────────────
  { _key: 'root', name: 'Residents / Voters', node_type: 'governance_body', branch: 'root', parent_id: null, sort_order: 0,
    description: 'The ultimate authority in Machias — all governance derives from the residents and voters of the Town.' },

  // ══════════════════════════════════════════════════════════════════════════
  // MUNICIPAL GOVERNMENT BRANCH
  // ══════════════════════════════════════════════════════════════════════════

  { _key: 'select_board', name: 'Select Board', node_type: 'governance_body', branch: 'municipal', parent_id: 'root', sort_order: 1,
    description: 'Five-member elected body; sets policy, approves budget, and appoints Town Manager.' },

  // Select Board Members
  { _key: 'sb_patryn',   name: 'Jake Patryn — Chair',      node_type: 'staff_role', branch: 'municipal', parent_id: 'select_board', sort_order: 1, staff_name: 'Jake Patryn',  description: 'Select Board Chair. Elected.' },
  { _key: 'sb_edwards',  name: 'Ben Edwards — Vice Chair', node_type: 'staff_role', branch: 'municipal', parent_id: 'select_board', sort_order: 2, staff_name: 'Ben Edwards',  description: 'Select Board Vice Chair. Elected.' },
  { _key: 'sb_m3',       name: 'Board Member',             node_type: 'staff_role', branch: 'municipal', parent_id: 'select_board', sort_order: 3, description: 'Select Board Member. Elected.' },
  { _key: 'sb_m4',       name: 'Board Member',             node_type: 'staff_role', branch: 'municipal', parent_id: 'select_board', sort_order: 4, description: 'Select Board Member. Elected.' },
  { _key: 'sb_m5',       name: 'Board Member',             node_type: 'staff_role', branch: 'municipal', parent_id: 'select_board', sort_order: 5, description: 'Select Board Member. Elected.' },

  // Advisory Boards (connect to Select Board)
  { _key: 'planning_board', name: 'Planning Board',            node_type: 'board_committee', branch: 'municipal', parent_id: 'select_board', sort_order: 20, is_advisory: true,
    description: 'Reviews land use applications, comprehensive planning, and zoning amendments.' },
  { _key: 'appeals_board',  name: 'Board of Appeals',          node_type: 'board_committee', branch: 'municipal', parent_id: 'select_board', sort_order: 21, is_advisory: true,
    description: 'Hears appeals of administrative decisions on zoning and permits.' },
  { _key: 'budget_comm',    name: 'Budget Committee',          node_type: 'board_committee', branch: 'municipal', parent_id: 'select_board', sort_order: 22, is_advisory: true,
    description: 'Reviews and recommends annual budget to Select Board and Town Meeting.' },
  { _key: 'airport_comm',   name: 'Airport Committee',         node_type: 'board_committee', branch: 'municipal', parent_id: 'select_board', sort_order: 23, is_advisory: true,
    description: 'Advisory body for airport planning and policy.' },
  { _key: 'other_comm',     name: 'Other Advisory Committees', node_type: 'board_committee', branch: 'municipal', parent_id: 'select_board', sort_order: 24, is_advisory: true,
    description: 'All other town advisory boards and committees.' },

  // Town Manager
  { _key: 'town_mgr', name: 'Town Manager', node_type: 'executive_leadership', branch: 'municipal', parent_id: 'select_board', sort_order: 10,
    staff_name: 'Sarah Craighead-Dedmon',
    description: 'Chief administrative officer. Implements Select Board policy, supervises all municipal departments.' },

  // ── Finance & Human Resources ────────────────────────────────────────────
  { _key: 'finance_hr', name: 'Finance & Human Resources', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 1,
    description: 'Financial management, budgeting, payroll, HR administration, grants management.', budget_link: 'General Fund — Administration' },

  { _key: 'finance_dir', name: 'Finance Director / Asst. HR Director', node_type: 'staff_role', branch: 'municipal', parent_id: 'finance_hr', sort_order: 1,
    staff_name: 'Nicholas MacDonald',
    description: 'Manages all municipal financial operations, budget preparation, payroll, and HR administration.',
    restructuring_status: 'proposed_change',
    restructuring_notes: 'Restructuring frees 45–60% of FD time from transactional tasks by adding Staff Accountant and Billing Specialist. Role evolves toward strategic financial management.' },
  { _key: 'sa_role', name: 'Staff Accountant', node_type: 'staff_role', branch: 'municipal', parent_id: 'finance_hr', sort_order: 2,
    description: 'AP/AR processing, payroll, bank reconciliation, grant financial reporting, audit prep.',
    restructuring_status: 'proposed_new',
    restructuring_notes: 'Phase 1 new hire. Resolves separation-of-duties deficiency. Funded by General Fund.' },
  { _key: 'bs_role', name: 'Billing Specialist', node_type: 'staff_role', branch: 'municipal', parent_id: 'finance_hr', sort_order: 3,
    description: 'In-house EMS billing, AR management, external municipal billing services.',
    restructuring_status: 'proposed_new',
    restructuring_notes: 'Phase 1 new hire (Month 7). Replaces Comstar contract. Funded by Ambulance Enterprise Fund.' },
  { _key: 'ga_role', name: 'GA Coordinator', node_type: 'staff_role', branch: 'municipal', parent_id: 'finance_hr', sort_order: 4,
    description: 'General Assistance program administration, grant tracking, federal/state compliance.',
    restructuring_status: 'proposed_new',
    restructuring_notes: 'Phase 1 stipend position (Month 9). Frees TM time from GA and grant administration.' },
  { _key: 'rc_role', name: 'Revenue Coordinator', node_type: 'staff_role', branch: 'municipal', parent_id: 'finance_hr', sort_order: 5,
    description: 'Manages regional services contracts and relationships with member municipalities.',
    restructuring_status: 'proposed_new',
    restructuring_notes: 'Trigger-based hire Year 3 — only when regional revenue covers fully loaded cost.' },

  // ── Town Clerk Office ────────────────────────────────────────────────────
  { _key: 'town_clerk', name: 'Town Clerk Office', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 2,
    description: 'Records, elections, licenses, vital statistics, and public information.' },
  { _key: 'clerk',       name: 'Town Clerk',        node_type: 'staff_role', branch: 'municipal', parent_id: 'town_clerk', sort_order: 1 },
  { _key: 'deputy_clerk',name: 'Deputy Town Clerk', node_type: 'staff_role', branch: 'municipal', parent_id: 'town_clerk', sort_order: 2 },

  // ── Police Department ────────────────────────────────────────────────────
  { _key: 'police', name: 'Police Department', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 3,
    description: 'Law enforcement, public safety, emergency dispatch coordination.', budget_link: 'General Fund — Public Safety' },
  { _key: 'police_chief', name: 'Chief of Police',            node_type: 'staff_role', branch: 'municipal', parent_id: 'police', sort_order: 1, staff_name: 'Keith Mercier' },
  { _key: 'officers',     name: 'Police Officers',            node_type: 'staff_role', branch: 'municipal', parent_id: 'police', sort_order: 2, staff_count: 6 },
  { _key: 'police_admin', name: 'Police Administrative Staff',node_type: 'staff_role', branch: 'municipal', parent_id: 'police', sort_order: 3, staff_count: 2 },

  // ── Fire Department ──────────────────────────────────────────────────────
  { _key: 'fire', name: 'Fire Department', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 4,
    description: 'Fire suppression, fire prevention, hazmat response. Primarily volunteer force.', budget_link: 'General Fund — Fire' },
  { _key: 'fire_chief',   name: 'Fire Chief',           node_type: 'staff_role', branch: 'municipal', parent_id: 'fire', sort_order: 1, staff_name: 'Joe Thompson' },
  { _key: 'firefighters', name: 'Volunteer Firefighters', node_type: 'staff_role', branch: 'municipal', parent_id: 'fire', sort_order: 2, staff_count: 20 },

  // ── Ambulance Department ─────────────────────────────────────────────────
  { _key: 'ambulance', name: 'Ambulance Department', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 5,
    description: 'Emergency medical services for Machias and surrounding region. ~1,648 transports/yr.', budget_link: 'Ambulance Enterprise Fund' },
  { _key: 'amb_chief',     name: 'Ambulance Chief', node_type: 'staff_role', branch: 'municipal', parent_id: 'ambulance', sort_order: 1 },
  { _key: 'ems_personnel', name: 'EMS Personnel',   node_type: 'staff_role', branch: 'municipal', parent_id: 'ambulance', sort_order: 2, staff_count: 12 },

  // ── Public Works ─────────────────────────────────────────────────────────
  { _key: 'public_works', name: 'Public Works Department', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 6,
    description: 'Roads, infrastructure maintenance, snow removal, vehicle fleet management.', budget_link: 'General Fund — Public Works' },
  { _key: 'pw_dir',  name: 'Public Works Director', node_type: 'staff_role', branch: 'municipal', parent_id: 'public_works', sort_order: 1, staff_name: 'Mike Schopee' },
  { _key: 'pw_crew', name: 'Public Works Crew',     node_type: 'staff_role', branch: 'municipal', parent_id: 'public_works', sort_order: 2, staff_count: 4 },

  // ── Wastewater ───────────────────────────────────────────────────────────
  { _key: 'wastewater', name: 'Wastewater Department', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 7,
    description: 'Wastewater treatment and sewer system operations.', budget_link: 'Sewer Enterprise Fund' },
  { _key: 'ww_operators', name: 'Wastewater Operators', node_type: 'staff_role', branch: 'municipal', parent_id: 'wastewater', sort_order: 1, staff_count: 3 },

  // ── Transfer Station ─────────────────────────────────────────────────────
  { _key: 'transfer_stn', name: 'Transfer Station', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 8,
    description: 'Solid waste management and recycling operations. Serves Machias and regional member towns.', budget_link: 'Transfer Station Enterprise Fund' },
  { _key: 'ts_staff', name: 'Transfer Station Attendants', node_type: 'staff_role', branch: 'municipal', parent_id: 'transfer_stn', sort_order: 1, staff_count: 3 },

  // ── Parks & Recreation ───────────────────────────────────────────────────
  { _key: 'parks_rec', name: 'Parks & Recreation', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 9,
    description: 'Public parks, recreational programming, community events.' },
  { _key: 'parks_staff', name: 'Parks & Recreation Staff', node_type: 'staff_role', branch: 'municipal', parent_id: 'parks_rec', sort_order: 1, staff_count: 3 },

  // ── Airport ──────────────────────────────────────────────────────────────
  { _key: 'airport', name: 'Machias Valley Airport', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 10,
    description: 'Machias Valley Airport operations, FAA compliance, hangar and tie-down leases.' },
  { _key: 'airport_admin', name: 'Airport Administration', node_type: 'staff_role', branch: 'municipal', parent_id: 'airport', sort_order: 1 },

  // ── Planning & Development ───────────────────────────────────────────────
  { _key: 'planning', name: 'Planning & Development', node_type: 'department', branch: 'municipal', parent_id: 'town_mgr', sort_order: 11,
    description: 'Comprehensive planning, zoning, permitting, economic development.' },
  { _key: 'planning_staff', name: 'Planning Department', node_type: 'staff_role', branch: 'municipal', parent_id: 'planning', sort_order: 1 },


  // ══════════════════════════════════════════════════════════════════════════
  // SCHOOL GOVERNANCE BRANCH — AOS 96
  // ══════════════════════════════════════════════════════════════════════════

  { _key: 'school_comm', name: 'School Committee (AOS 96)', node_type: 'governance_body', branch: 'school', parent_id: 'root', sort_order: 2,
    description: 'Elected school committee for AOS 96. Sets education policy, approves school budget.' },

  // School Committee Members
  { _key: 'sc_saddler', name: 'Teresa Saddler',  node_type: 'staff_role', branch: 'school', parent_id: 'school_comm', sort_order: 1, staff_name: 'Teresa Saddler',  description: 'School Committee Member. Elected.' },
  { _key: 'sc_morse',   name: 'Cathy Morse',     node_type: 'staff_role', branch: 'school', parent_id: 'school_comm', sort_order: 2, staff_name: 'Cathy Morse',     description: 'School Committee Member. Elected.' },
  { _key: 'sc_flower',  name: 'Chloe Flower',    node_type: 'staff_role', branch: 'school', parent_id: 'school_comm', sort_order: 3, staff_name: 'Chloe Flower',    description: 'School Committee Member. Elected.' },
  { _key: 'sc_tbd1',    name: 'Member — TBD',    node_type: 'staff_role', branch: 'school', parent_id: 'school_comm', sort_order: 4, description: 'School Committee Member. Position to be filled.' },
  { _key: 'sc_tbd2',    name: 'Member — TBD',    node_type: 'staff_role', branch: 'school', parent_id: 'school_comm', sort_order: 5, description: 'School Committee Member. Position to be filled.' },

  // Superintendent
  { _key: 'superintendent', name: 'Superintendent (AOS 96)', node_type: 'executive_leadership', branch: 'school', parent_id: 'school_comm', sort_order: 10,
    staff_name: 'Nicole Case',
    description: 'Chief executive of AOS 96 school district. Oversees all schools within the administrative unit.' },

  // ── District Administration ───────────────────────────────────────────────
  { _key: 'dist_admin', name: 'District Administration', node_type: 'division', branch: 'school', parent_id: 'superintendent', sort_order: 1,
    description: 'Central office administration supporting all schools in AOS 96.' },
  { _key: 'curriculum', name: 'IASA / Curriculum Coordinator', node_type: 'staff_role', branch: 'school', parent_id: 'dist_admin', sort_order: 1,
    staff_name: 'Mitchell Look', description: 'Coordinates K–12 curriculum alignment, instructional coaching, and assessment.' },
  { _key: 'sped_dir', name: 'Special Education Director', node_type: 'staff_role', branch: 'school', parent_id: 'dist_admin', sort_order: 2,
    staff_name: 'Mary Maker', description: 'Oversees all special education services and IEP compliance across AOS 96.' },

  // ══════════════════════════════════════════════════════════════════════════
  // MACHIAS MEMORIAL HIGH SCHOOL
  // ══════════════════════════════════════════════════════════════════════════
  { _key: 'mmhs', name: 'Machias Memorial High School', node_type: 'school', branch: 'school', parent_id: 'superintendent', sort_order: 2,
    description: 'Grades 9–12. Serves Machias and surrounding communities.' },
  { _key: 'mmhs_principal', name: 'Principal', node_type: 'staff_role', branch: 'school', parent_id: 'mmhs', sort_order: 1, staff_name: 'Wendy Black' },
  { _key: 'mmhs_faculty',   name: 'Faculty & Staff', node_type: 'division', branch: 'school', parent_id: 'mmhs', sort_order: 2 },
  { _key: 'mmhs_teachers',  name: 'Classroom Teachers',  node_type: 'staff_role', branch: 'school', parent_id: 'mmhs_faculty', sort_order: 1, staff_count: 20 },
  { _key: 'mmhs_specialists', name: 'Specialists',       node_type: 'staff_role', branch: 'school', parent_id: 'mmhs_faculty', sort_order: 2, description: 'Art, music, PE, library, technology.' },
  { _key: 'mmhs_sped',      name: 'Special Education',   node_type: 'program',    branch: 'school', parent_id: 'mmhs_faculty', sort_order: 3 },
  { _key: 'mmhs_support',   name: 'Support Services',    node_type: 'support_services', branch: 'school', parent_id: 'mmhs', sort_order: 3 },

  // ══════════════════════════════════════════════════════════════════════════
  // ROSE M. GAFFNEY ELEMENTARY SCHOOL
  // ══════════════════════════════════════════════════════════════════════════
  { _key: 'rmg', name: 'Rose M. Gaffney Elementary', node_type: 'school', branch: 'school', parent_id: 'superintendent', sort_order: 3,
    description: 'Pre-K through Grade 8.' },

  // RMG Leadership
  { _key: 'rmg_principal', name: 'Principal',                          node_type: 'staff_role', branch: 'school', parent_id: 'rmg', sort_order: 1, staff_name: 'Sue Dow' },
  { _key: 'rmg_ap',        name: 'Assistant Principal / Athletic Dir.', node_type: 'staff_role', branch: 'school', parent_id: 'rmg', sort_order: 2, staff_name: 'Chad Fitzsimmons',
    description: 'Assistant Principal and Athletic Director.' },

  // ── RMG Administration ───────────────────────────────────────────────────
  { _key: 'rmg_admin', name: 'RMGE Administration', node_type: 'division', branch: 'school', parent_id: 'rmg', sort_order: 3 },
  { _key: 'rmg_counselor', name: 'School Counselor',                         node_type: 'staff_role', branch: 'school', parent_id: 'rmg_admin', sort_order: 1, staff_name: 'Webber Shaffett' },
  { _key: 'rmg_nurse',     name: 'School Nurse',                             node_type: 'staff_role', branch: 'school', parent_id: 'rmg_admin', sort_order: 2, staff_name: 'Lori Martin' },
  { _key: 'rmg_aa1',       name: 'Administrative Assistant',                 node_type: 'staff_role', branch: 'school', parent_id: 'rmg_admin', sort_order: 3, staff_name: 'Tammy O\'Neal' },
  { _key: 'rmg_aa2',       name: 'Administrative Assistant',                 node_type: 'staff_role', branch: 'school', parent_id: 'rmg_admin', sort_order: 4, staff_name: 'Beth McCurdy' },
  { _key: 'rmg_aa3',       name: 'Administrative Assistant / Title I Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_admin', sort_order: 5, staff_name: 'Cassandra Worcester' },

  // ── RMG Classroom Teachers ───────────────────────────────────────────────
  { _key: 'rmg_teachers', name: 'Classroom Teachers', node_type: 'division', branch: 'school', parent_id: 'rmg', sort_order: 4 },

  { _key: 'rmg_prek', name: 'Pre-Kindergarten', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 1 },
  { _key: 'rmg_prek_pena',  name: 'Pre-K Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_prek', sort_order: 1, staff_name: 'Alexandra Peña' },
  { _key: 'rmg_prek_heath', name: 'Pre-K Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_prek', sort_order: 2, staff_name: 'Amber Heath' },

  { _key: 'rmg_k', name: 'Kindergarten', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 2 },
  { _key: 'rmg_k_raye',   name: 'Kindergarten Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_k', sort_order: 1, staff_name: 'Ada Raye' },
  { _key: 'rmg_k_rolfe',  name: 'Kindergarten Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_k', sort_order: 2, staff_name: 'Christy Rolfe-Taylor' },

  { _key: 'rmg_g1', name: '1st Grade', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 3 },
  { _key: 'rmg_g1_bunker', name: '1st Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g1', sort_order: 1, staff_name: 'Jennifer Bunker' },
  { _key: 'rmg_g1_morgan', name: '1st Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g1', sort_order: 2, staff_name: 'Abigayle Morgan' },

  { _key: 'rmg_g2', name: '2nd Grade', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 4 },
  { _key: 'rmg_g2_littlefield', name: '2nd Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g2', sort_order: 1, staff_name: 'Ashlynn Littlefield' },
  { _key: 'rmg_g2_whitney',     name: '2nd Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g2', sort_order: 2, staff_name: 'Janis Whitney' },

  { _key: 'rmg_g3', name: '3rd Grade', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 5 },
  { _key: 'rmg_g3_congelosi', name: '3rd Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g3', sort_order: 1, staff_name: 'Sarah Congelosi' },
  { _key: 'rmg_g3_dyer',      name: '3rd Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g3', sort_order: 2, staff_name: 'James Dyer' },

  { _key: 'rmg_g4', name: '4th Grade', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 6 },
  { _key: 'rmg_g4_singh',  name: '4th Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g4', sort_order: 1, staff_name: 'Elizabeth Singh' },
  { _key: 'rmg_g4_wilson', name: '4th Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g4', sort_order: 2, staff_name: 'Tim Wilson' },

  { _key: 'rmg_g5', name: '5th Grade', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 7 },
  { _key: 'rmg_g5_roy',      name: '5th Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g5', sort_order: 1, staff_name: 'Caitlin Roy' },
  { _key: 'rmg_g5_woodward', name: '5th Grade Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g5', sort_order: 2, staff_name: 'Kelly Woodward' },

  { _key: 'rmg_g6', name: '6th Grade', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 8 },
  { _key: 'rmg_g6_nadeau',    name: '6th Grade — English / Social Studies', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g6', sort_order: 1, staff_name: 'Carolyn Nadeau' },
  { _key: 'rmg_g6_roesselet', name: '6th Grade — Science / Math',           node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g6', sort_order: 2, staff_name: 'Heidi Roesselet' },

  { _key: 'rmg_g78', name: '7th & 8th Grade', node_type: 'division', branch: 'school', parent_id: 'rmg_teachers', sort_order: 9 },
  { _key: 'rmg_g78_hartsgrove', name: '7–8 Science / Health', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g78', sort_order: 1, staff_name: 'Katie Hartsgrove' },
  { _key: 'rmg_g78_herger',     name: '7–8 Math',             node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g78', sort_order: 2, staff_name: 'Matt Herger' },
  { _key: 'rmg_g78_shaw_l',     name: '7–8 Social Studies',   node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g78', sort_order: 3, staff_name: 'Luke Shaw' },
  { _key: 'rmg_g78_shaw_t',     name: '7–8 English Language Arts', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_g78', sort_order: 4, staff_name: 'Tanya Shaw' },

  // ── RMG Specialists ──────────────────────────────────────────────────────
  { _key: 'rmg_specialists', name: 'Specialists', node_type: 'division', branch: 'school', parent_id: 'rmg', sort_order: 5 },
  { _key: 'rmg_sp_baker',    name: 'Band / Chorus Director',    node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 1,  staff_name: 'Nadine Baker' },
  { _key: 'rmg_sp_burgess',  name: 'JMG Specialist',            node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 2,  staff_name: 'Ellie Burgess' },
  { _key: 'rmg_sp_hammond',  name: 'Technology Coordinator',    node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 3,  staff_name: 'Robbie Hammond' },
  { _key: 'rmg_sp_kilton',   name: 'Art Teacher',               node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 4,  staff_name: 'Kelly Kilton' },
  { _key: 'rmg_sp_whitney',  name: 'Physical Education Teacher',node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 5,  staff_name: 'Kate Whitney' },
  { _key: 'rmg_sp_faulkner', name: 'Librarian / Keyboarding',   node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 6,  staff_name: 'Kaitlyn Faulkner' },
  { _key: 'rmg_sp_spencer',  name: 'Speech Clinician',          node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 7,  staff_name: 'Stacey Spencer' },
  { _key: 'rmg_sp_keeton',   name: 'Occupational Therapist',    node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 8,  staff_name: 'Kate Keeton' },
  { _key: 'rmg_sp_verburgt', name: 'School Resource Officer',   node_type: 'staff_role', branch: 'school', parent_id: 'rmg_specialists', sort_order: 9,  staff_name: 'Christy Verburgt' },

  // ── RMG Special Education ────────────────────────────────────────────────
  { _key: 'rmg_sped', name: 'Special Education', node_type: 'program', branch: 'school', parent_id: 'rmg', sort_order: 6 },

  // SpEd Teachers
  { _key: 'rmg_sped_teachers', name: 'SpEd Teachers', node_type: 'division', branch: 'school', parent_id: 'rmg_sped', sort_order: 1 },
  { _key: 'rmg_sped_chandler', name: 'K-3 Special Education Teacher', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_teachers', sort_order: 1, staff_name: 'Amy Chandler' },
  { _key: 'rmg_sped_dolley',   name: 'Special Education Teacher',    node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_teachers', sort_order: 2, staff_name: 'Lynda Dolley' },
  { _key: 'rmg_sped_open',     name: 'K-3 Special Education Teacher — Position Open', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_teachers', sort_order: 3,
    restructuring_status: 'proposed_new', description: 'Open position.' },

  // SpEd Technicians
  { _key: 'rmg_sped_techs', name: 'Special Education Technicians', node_type: 'division', branch: 'school', parent_id: 'rmg_sped', sort_order: 2 },
  { _key: 'rmg_sped_t1',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 1,  staff_name: 'Sally Herger' },
  { _key: 'rmg_sped_t2',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 2,  staff_name: 'Jessica Cole' },
  { _key: 'rmg_sped_t3',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 3,  staff_name: 'Toshia Day-Benner' },
  { _key: 'rmg_sped_t4',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 4,  staff_name: 'Gail Johnson' },
  { _key: 'rmg_sped_t5',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 5,  staff_name: 'Tina Leighton' },
  { _key: 'rmg_sped_t6',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 6,  staff_name: 'Lynda St Clair' },
  { _key: 'rmg_sped_t7',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 7,  staff_name: 'Tanner Rolfe' },
  { _key: 'rmg_sped_t8',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 8,  staff_name: 'Amanda Manship' },
  { _key: 'rmg_sped_t9',  name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 9,  staff_name: 'Monique Smith' },
  { _key: 'rmg_sped_t10', name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 10, staff_name: 'Megan Faulkner' },
  { _key: 'rmg_sped_t11', name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 11, staff_name: 'Marsha Edwards' },
  { _key: 'rmg_sped_t12', name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 12, staff_name: 'Keeley Tibbetts' },
  { _key: 'rmg_sped_t13', name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 13, staff_name: 'Mariah Crowley' },
  { _key: 'rmg_sped_t14', name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 14, staff_name: 'Hayley Murphy' },
  { _key: 'rmg_sped_t15', name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 15, staff_name: 'Hannah Faulkingham' },
  { _key: 'rmg_sped_t16', name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 16, staff_name: 'Alexis Verburgt' },
  { _key: 'rmg_sped_t17', name: 'SpEd Technician', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_sped_techs', sort_order: 17, staff_name: 'Kate Goggin' },

  // ── RMG Title I ──────────────────────────────────────────────────────────
  { _key: 'rmg_title1', name: 'Title I Program', node_type: 'program', branch: 'school', parent_id: 'rmg', sort_order: 7 },
  { _key: 'rmg_t1_look',     name: 'Title I Teacher',             node_type: 'staff_role', branch: 'school', parent_id: 'rmg_title1', sort_order: 1, staff_name: 'Renee Look' },
  { _key: 'rmg_t1_techs',    name: 'Title I Educational Technicians', node_type: 'division', branch: 'school', parent_id: 'rmg_title1', sort_order: 2 },
  { _key: 'rmg_t1_keenan',   name: 'Title I Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_t1_techs', sort_order: 1, staff_name: 'Keenan Look' },
  { _key: 'rmg_t1_matthews', name: 'Title I Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_t1_techs', sort_order: 2, staff_name: 'Amy Matthews' },
  { _key: 'rmg_t1_preston',  name: 'Title I Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_t1_techs', sort_order: 3, staff_name: 'Tanya Preston' },
  { _key: 'rmg_t1_worcester',name: 'Title I Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_t1_techs', sort_order: 4, staff_name: 'Cassandra Worcester' },
  { _key: 'rmg_t1_beal',     name: 'Title I Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_t1_techs', sort_order: 5, staff_name: 'Eli Beal' },
  { _key: 'rmg_t1_albee',    name: 'Title I Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_t1_techs', sort_order: 6, staff_name: 'Christina Albee' },
  { _key: 'rmg_t1_hatt',     name: 'Title I Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_t1_techs', sort_order: 7, staff_name: 'Ryan Hatt' },

  // ── Pre-K Ed Techs ───────────────────────────────────────────────────────
  { _key: 'rmg_prek_techs', name: 'Pre-K Educational Technicians', node_type: 'division', branch: 'school', parent_id: 'rmg_prek', sort_order: 3 },
  { _key: 'rmg_prek_alley', name: 'Pre-K Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_prek_techs', sort_order: 1, staff_name: 'Dayna Alley' },
  { _key: 'rmg_prek_casey', name: 'Pre-K Ed Tech', node_type: 'staff_role', branch: 'school', parent_id: 'rmg_prek_techs', sort_order: 2, staff_name: 'Amy Casey' },

  // ── Transportation & Facilities (shared AOS 96) ───────────────────────────
  { _key: 'aos_support', name: 'Transportation & Facilities', node_type: 'support_services', branch: 'school', parent_id: 'superintendent', sort_order: 4,
    description: 'Shared transportation, food service, and facilities management for AOS 96 schools.' },

  { _key: 'trans_dir',  name: 'Transportation Director', node_type: 'staff_role', branch: 'school', parent_id: 'aos_support', sort_order: 1, staff_name: 'Mike Hinerman' },
  { _key: 'food_dir',   name: 'Food Service Director',   node_type: 'staff_role', branch: 'school', parent_id: 'aos_support', sort_order: 2, staff_name: 'Emily Fitzsimmons' },
  { _key: 'facilities', name: 'Facilities Manager',      node_type: 'staff_role', branch: 'school', parent_id: 'aos_support', sort_order: 3, staff_name: 'Kris Smith' },

  // Food Service
  { _key: 'food_svc', name: 'Food Service', node_type: 'division', branch: 'school', parent_id: 'aos_support', sort_order: 4 },
  { _key: 'food_luce',  name: 'Kitchen Manager',         node_type: 'staff_role', branch: 'school', parent_id: 'food_svc', sort_order: 1, staff_name: 'Stephanie Luce' },
  { _key: 'food_look',  name: 'Cook',                    node_type: 'staff_role', branch: 'school', parent_id: 'food_svc', sort_order: 2, staff_name: 'Gracie Look' },
  { _key: 'food_cloney',name: 'Cook / Whitneyville Driver', node_type: 'staff_role', branch: 'school', parent_id: 'food_svc', sort_order: 3, staff_name: 'Brenda Cloney' },

  // Bus Drivers
  { _key: 'bus_drivers', name: 'Bus Drivers', node_type: 'division', branch: 'school', parent_id: 'aos_support', sort_order: 5 },
  { _key: 'bus_stoddard', name: 'Machias Driver',            node_type: 'staff_role', branch: 'school', parent_id: 'bus_drivers', sort_order: 1, staff_name: 'Wayne Stoddard' },
  { _key: 'bus_msmith',   name: 'Machias Driver',            node_type: 'staff_role', branch: 'school', parent_id: 'bus_drivers', sort_order: 2, staff_name: 'Mike Smith' },
  { _key: 'bus_hinerman', name: 'Roque Bluffs Driver',       node_type: 'staff_role', branch: 'school', parent_id: 'bus_drivers', sort_order: 3, staff_name: 'Mike Hinerman' },
  { _key: 'bus_mawson',   name: 'Marshfield Driver',         node_type: 'staff_role', branch: 'school', parent_id: 'bus_drivers', sort_order: 4, staff_name: 'Cindy Mawson' },
  { _key: 'bus_dsmith',   name: 'Northfield / Wesley Driver',node_type: 'staff_role', branch: 'school', parent_id: 'bus_drivers', sort_order: 5, staff_name: 'David Smith' },

  // Custodial
  { _key: 'custodial', name: 'Custodial', node_type: 'division', branch: 'school', parent_id: 'aos_support', sort_order: 6 },
  { _key: 'cust_decatur', name: 'Custodian', node_type: 'staff_role', branch: 'school', parent_id: 'custodial', sort_order: 1, staff_name: 'Lois Decatur' },
  { _key: 'cust_pianta',  name: 'Custodian', node_type: 'staff_role', branch: 'school', parent_id: 'custodial', sort_order: 2, staff_name: 'Michael Pianta' },
];