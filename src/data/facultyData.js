// Faculty -> Department mapping used to drive the cascading selects on the
// "Complete your profile" page. Keep this as the single source of truth so
// admin screens / filters can reuse it later if needed.
export const FACULTIES = [
  {
    name: "Faculty of Agriculture",
    departments: [
      "Agricultural Economics",
      "Agricultural Extension and Rural Sociology",
      "Animal Science",
      "Crop Protection",
      "Crop Science",
      "Fisheries and Aquaculture",
      "Food Science and Technology",
      "Forestry and Wildlife Management",
      "Home Science",
      "Soil Science",
      "Agricultural Engineering",
      "Horticulture",
      "Agricultural Business",
    ],
  },
  {
    name: "Faculty of Arts",
    departments: [
      "Arabic",
      "Christian Religious Studies",
      "English and Literary Studies",
      "History and Diplomatic Studies",
      "Islamic Studies",
      "Linguistics",
      "Philosophy",
      "Theatre Arts",
    ],
  },
  {
    name: "Faculty of Basic Medical Sciences",
    departments: ["Anatomy", "Biochemistry", "Human Physiology", "Pharmacology"],
  },
  {
    name: "Faculty of Clinical Sciences",
    departments: ["Medicine and Surgery (MBBS)"],
  },
  {
    name: "Faculty of Communication and Media Studies",
    departments: ["Advertising", "Broadcasting", "Journalism and Media Studies", "Public Relations"],
  },
  {
    name: "Faculty of Education",
    departments: [
      "Arts Education",
      "Educational Foundations",
      "Educational Management",
      "Science and Environmental Education",
      "Social Science Education",
      "Counselling and Human Development Studies",
      "Library and Information Science",
    ],
  },
  {
    name: "Faculty of Engineering",
    departments: [
      "Civil Engineering",
      "Chemical Engineering",
      "Electrical and Electronic Engineering",
      "Mechanical Engineering",
      "Mechatronics Engineering",
      "Petroleum and Gas Engineering",
      "Materials and Metallurgical Engineering",
      "Computer Engineering",
    ],
  },
  {
    name: "Faculty of Environmental Sciences",
    departments: ["Architecture", "Building", "Estate Management", "Urban and Regional Planning"],
  },
  {
    name: "Faculty of Law",
    departments: [
      "Public Law",
      "Private and Property Law",
      "International Law and Jurisprudence",
      "Commercial Law",
      "Islamic Law",
    ],
  },
  {
    name: "Faculty of Management Sciences",
    departments: [
      "Accounting",
      "Banking and Finance",
      "Business Administration",
      "Public Administration",
      "Taxation",
      "Actuarial Science",
    ],
  },
  {
    name: "Faculty of Nursing and Allied Health Sciences",
    departments: ["Nursing Science", "Medical Laboratory Science"],
  },
  {
    name: "Faculty of Science",
    departments: [
      "Biological Sciences",
      "Chemistry",
      "Computer Science",
      "Geology",
      "Mathematics",
      "Microbiology",
      "Physics",
      "Statistics",
      "Geography",
      "Industrial Chemistry",
      "Science Laboratory Technology",
    ],
  },
  {
    name: "Faculty of Social Sciences",
    departments: ["Economics", "Political Science and International Relations", "Sociology", "Geography"],
  },
  {
    name: "Faculty of Veterinary Medicine",
    departments: [
      "Veterinary Anatomy",
      "Veterinary Physiology and Biochemistry",
      "Veterinary Pathology",
      "Veterinary Pharmacology and Toxicology",
      "Veterinary Microbiology",
      "Veterinary Parasitology and Entomology",
      "Veterinary Public Health and Preventive Medicine",
      "Veterinary Medicine",
      "Veterinary Surgery and Radiology",
      "Theriogenology and Animal Production",
    ],
  },
];

export function departmentsFor(facultyName) {
  return FACULTIES.find((f) => f.name === facultyName)?.departments ?? [];
}

/** Canonical academic levels — single source of truth for students & Course Reps */
export const LEVELS = [
  "100 Level",
  "200 Level",
  "300 Level",
  "400 Level",
  "500 Level",
  "Postgraduate",
];

