// Load sample contract data into the API server
const sampleContractData = {
    title: "Software Development Agreement",
    sections: [
        {
            id: "recitals",
            title: "RECITALS",
            content: [
                "WHEREAS, Company desires to engage Developer to develop custom software solutions for its business operations;",
                "WHEREAS, Developer has the expertise, experience, and resources necessary to provide the software development services described herein;",
                "WHEREAS, the parties wish to set forth the terms and conditions of their agreement;",
                "NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:"
            ],
            level: 1,
            paragraphIndex: 0,
            expanded: false,
            subsections: []
        },
        {
            id: "section-1",
            title: "1. PROJECT SCOPE AND SPECIFICATIONS",
            content: [],
            level: 1,
            paragraphIndex: 1,
            expanded: false,
            subsections: [
                {
                    id: "section-1-1",
                    title: "1.1 Overview",
                    content: [
                        "Developer shall design, develop, and deliver a comprehensive customer relationship management (CRM) system tailored to Company's specific business requirements. The system shall include modules for customer data management, sales tracking, inventory control, and financial reporting."
                    ],
                    level: 2,
                    paragraphIndex: 2,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-1-2",
                    title: "1.2 Functional Requirements",
                    content: [
                        "The CRM system shall provide the following core functionalities:",
                        "• Customer database with advanced search and filtering capabilities",
                        "• Lead generation and conversion tracking",
                        "• Sales pipeline management with customizable stages",
                        "• Automated email marketing integration",
                        "• Real-time reporting and analytics dashboard",
                        "• Mobile-responsive web interface",
                        "• Integration with existing accounting software",
                        "• Multi-user access with role-based permissions"
                    ],
                    level: 2,
                    paragraphIndex: 3,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-1-3",
                    title: "1.3 Technical Specifications",
                    content: [
                        "The system shall be built using modern web technologies including React.js for the frontend, Node.js for the backend, and PostgreSQL for data storage. The application shall be cloud-hosted on AWS infrastructure with SSL encryption and regular automated backups."
                    ],
                    level: 2,
                    paragraphIndex: 4,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-2",
            title: "2. DEVELOPMENT TIMELINE",
            content: [],
            level: 1,
            paragraphIndex: 5,
            expanded: false,
            subsections: [
                {
                    id: "section-2-1",
                    title: "2.1 Project Phases",
                    content: [
                        "The development shall be completed in four distinct phases:",
                        "Phase 1: Requirements analysis and system design (4 weeks)",
                        "Phase 2: Core functionality development (8 weeks)",
                        "Phase 3: Integration and testing (4 weeks)",
                        "Phase 4: Deployment and training (2 weeks)"
                    ],
                    level: 2,
                    paragraphIndex: 6,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-2-2",
                    title: "2.2 Milestones and Deliverables",
                    content: [
                        "Each phase shall conclude with specific deliverables subject to Company's approval. Developer shall provide weekly progress reports and maintain a shared project management dashboard accessible to Company stakeholders."
                    ],
                    level: 2,
                    paragraphIndex: 7,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-3",
            title: "3. PAYMENT TERMS",
            content: [],
            level: 1,
            paragraphIndex: 8,
            expanded: false,
            subsections: [
                {
                    id: "section-3-1",
                    title: "3.1 Total Project Cost",
                    content: [
                        "The total cost for the development project is $185,000 USD, payable according to the schedule outlined in Section 3.2."
                    ],
                    level: 2,
                    paragraphIndex: 9,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-3-2",
                    title: "3.2 Payment Schedule",
                    content: [
                        "Payments shall be made as follows:",
                        "• 25% ($46,250) upon execution of this Agreement",
                        "• 25% ($46,250) upon completion of Phase 1",
                        "• 25% ($46,250) upon completion of Phase 2",
                        "• 25% ($46,250) upon final delivery and acceptance"
                    ],
                    level: 2,
                    paragraphIndex: 10,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-3-3",
                    title: "3.3 Payment Methods",
                    content: [
                        "All payments shall be made via wire transfer or certified check within thirty (30) days of invoice date. Late payments shall incur a service charge of 1.5% per month."
                    ],
                    level: 2,
                    paragraphIndex: 11,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-4",
            title: "4. INTELLECTUAL PROPERTY RIGHTS",
            content: [],
            level: 1,
            paragraphIndex: 12,
            expanded: false,
            subsections: [
                {
                    id: "section-4-1",
                    title: "4.1 Work Product Ownership",
                    content: [
                        "All work product, including but not limited to source code, documentation, designs, and related materials created by Developer under this Agreement, shall be the exclusive property of Company."
                    ],
                    level: 2,
                    paragraphIndex: 13,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-4-2",
                    title: "4.2 Developer Tools and Libraries",
                    content: [
                        "Developer may utilize standard development tools, frameworks, and open-source libraries in the creation of the work product, provided such use does not infringe upon third-party rights or compromise the security of the system."
                    ],
                    level: 2,
                    paragraphIndex: 14,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-4-3",
                    title: "4.3 Pre-existing Intellectual Property",
                    content: [
                        "Each party shall retain ownership of its respective pre-existing intellectual property. Developer grants Company a non-exclusive license to use any pre-existing Developer IP incorporated into the work product."
                    ],
                    level: 2,
                    paragraphIndex: 15,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-5",
            title: "5. CONFIDENTIALITY",
            content: [],
            level: 1,
            paragraphIndex: 16,
            expanded: false,
            subsections: [
                {
                    id: "section-5-1",
                    title: "5.1 Confidential Information",
                    content: [
                        "Both parties acknowledge that they may have access to confidential information of the other party, including but not limited to business plans, customer lists, technical specifications, and proprietary methodologies."
                    ],
                    level: 2,
                    paragraphIndex: 17,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-5-2",
                    title: "5.2 Non-Disclosure Obligations",
                    content: [
                        "Each party agrees to maintain the confidentiality of the other party's confidential information and to use such information solely for the purposes of this Agreement."
                    ],
                    level: 2,
                    paragraphIndex: 18,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-5-3",
                    title: "5.3 Duration of Confidentiality",
                    content: [
                        "The confidentiality obligations shall survive termination of this Agreement and shall remain in effect for a period of five (5) years."
                    ],
                    level: 2,
                    paragraphIndex: 19,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-6",
            title: "6. WARRANTIES AND REPRESENTATIONS",
            content: [],
            level: 1,
            paragraphIndex: 20,
            expanded: false,
            subsections: [
                {
                    id: "section-6-1",
                    title: "6.1 Developer Warranties",
                    content: [
                        "Developer warrants that it has the necessary skills, experience, and resources to perform the services described herein. Developer further warrants that the work product shall be free from defects and shall perform in accordance with the specifications."
                    ],
                    level: 2,
                    paragraphIndex: 21,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-6-2",
                    title: "6.2 Company Warranties",
                    content: [
                        "Company warrants that it has the authority to enter into this Agreement and that it will provide Developer with timely access to necessary information and resources required for project completion."
                    ],
                    level: 2,
                    paragraphIndex: 22,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-6-3",
                    title: "6.3 Mutual Warranties",
                    content: [
                        "Both parties warrant that the execution of this Agreement does not conflict with any existing agreements or obligations."
                    ],
                    level: 2,
                    paragraphIndex: 23,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-7",
            title: "7. INDEMNIFICATION",
            content: [],
            level: 1,
            paragraphIndex: 24,
            expanded: false,
            subsections: [
                {
                    id: "section-7-1",
                    title: "7.1 Developer Indemnification",
                    content: [
                        "Developer shall indemnify and hold Company harmless from any claims, damages, or expenses arising from Developer's breach of this Agreement or negligent performance of services."
                    ],
                    level: 2,
                    paragraphIndex: 25,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-7-2",
                    title: "7.2 Company Indemnification",
                    content: [
                        "Company shall indemnify and hold Developer harmless from any claims arising from Company's misuse of the work product or breach of this Agreement."
                    ],
                    level: 2,
                    paragraphIndex: 26,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-8",
            title: "8. LIMITATION OF LIABILITY",
            content: [],
            level: 1,
            paragraphIndex: 27,
            expanded: false,
            subsections: [
                {
                    id: "section-8-1",
                    title: "8.1 Liability Cap",
                    content: [
                        "In no event shall either party's total liability under this Agreement exceed the total amount paid or payable under this Agreement."
                    ],
                    level: 2,
                    paragraphIndex: 28,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-8-2",
                    title: "8.2 Consequential Damages",
                    content: [
                        "Neither party shall be liable for any indirect, incidental, special, or consequential damages, including lost profits or business interruption."
                    ],
                    level: 2,
                    paragraphIndex: 29,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-9",
            title: "9. SUPPORT AND MAINTENANCE",
            content: [],
            level: 1,
            paragraphIndex: 30,
            expanded: false,
            subsections: [
                {
                    id: "section-9-1",
                    title: "9.1 Warranty Period",
                    content: [
                        "Developer shall provide ninety (90) days of free support and bug fixes following final delivery and acceptance of the work product."
                    ],
                    level: 2,
                    paragraphIndex: 31,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-9-2",
                    title: "9.2 Ongoing Maintenance",
                    content: [
                        "After the warranty period, Company may engage Developer for ongoing maintenance and support services under a separate agreement to be negotiated in good faith."
                    ],
                    level: 2,
                    paragraphIndex: 32,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-10",
            title: "10. TESTING AND ACCEPTANCE",
            content: [],
            level: 1,
            paragraphIndex: 33,
            expanded: false,
            subsections: [
                {
                    id: "section-10-1",
                    title: "10.1 Testing Procedures",
                    content: [
                        "Company shall have thirty (30) days from delivery of each milestone to test and evaluate the work product. Testing shall be conducted in accordance with mutually agreed-upon acceptance criteria."
                    ],
                    level: 2,
                    paragraphIndex: 34,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-10-2",
                    title: "10.2 Acceptance Process",
                    content: [
                        "Company may accept or reject deliverables based on conformity to specifications. Any rejection must be accompanied by detailed written explanation of deficiencies."
                    ],
                    level: 2,
                    paragraphIndex: 35,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-10-3",
                    title: "10.3 Correction of Defects",
                    content: [
                        "Developer shall have thirty (30) days to correct any documented defects or non-conformities identified during the acceptance testing process."
                    ],
                    level: 2,
                    paragraphIndex: 36,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-11",
            title: "11. CHANGE MANAGEMENT",
            content: [],
            level: 1,
            paragraphIndex: 37,
            expanded: false,
            subsections: [
                {
                    id: "section-11-1",
                    title: "11.1 Change Request Process",
                    content: [
                        "Any modifications to the project scope must be documented in writing and approved by both parties before implementation."
                    ],
                    level: 2,
                    paragraphIndex: 38,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-11-2",
                    title: "11.2 Impact Assessment",
                    content: [
                        "Developer shall provide a written impact assessment for any requested changes, including effects on timeline, budget, and technical specifications."
                    ],
                    level: 2,
                    paragraphIndex: 39,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-11-3",
                    title: "11.3 Additional Compensation",
                    content: [
                        "Changes that increase the scope of work may result in additional compensation to be negotiated between the parties."
                    ],
                    level: 2,
                    paragraphIndex: 40,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-12",
            title: "12. TERMINATION",
            content: [],
            level: 1,
            paragraphIndex: 41,
            expanded: false,
            subsections: [
                {
                    id: "section-12-1",
                    title: "12.1 Termination for Cause",
                    content: [
                        "Either party may terminate this Agreement immediately upon written notice if the other party materially breaches this Agreement and fails to cure such breach within thirty (30) days."
                    ],
                    level: 2,
                    paragraphIndex: 42,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-12-2",
                    title: "12.2 Termination for Convenience",
                    content: [
                        "Company may terminate this Agreement at any time upon thirty (30) days written notice to Developer."
                    ],
                    level: 2,
                    paragraphIndex: 43,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-12-3",
                    title: "12.3 Effects of Termination",
                    content: [
                        "Upon termination, Developer shall deliver all work product completed to date, and Company shall pay for all services performed and expenses incurred up to the termination date."
                    ],
                    level: 2,
                    paragraphIndex: 44,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-13",
            title: "13. FORCE MAJEURE",
            content: [],
            level: 1,
            paragraphIndex: 45,
            expanded: false,
            subsections: [
                {
                    id: "section-13-1",
                    title: "13.1 Excused Performance",
                    content: [
                        "Neither party shall be liable for any delay or failure to perform due to causes beyond its reasonable control, including but not limited to natural disasters, government actions, or cyber attacks."
                    ],
                    level: 2,
                    paragraphIndex: 46,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-13-2",
                    title: "13.2 Notification Requirements",
                    content: [
                        "The affected party shall promptly notify the other party of any force majeure event and shall use reasonable efforts to minimize the impact of such event."
                    ],
                    level: 2,
                    paragraphIndex: 47,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-14",
            title: "14. DISPUTE RESOLUTION",
            content: [],
            level: 1,
            paragraphIndex: 48,
            expanded: false,
            subsections: [
                {
                    id: "section-14-1",
                    title: "14.1 Negotiation",
                    content: [
                        "The parties agree to attempt to resolve any disputes through good faith negotiations before pursuing other remedies."
                    ],
                    level: 2,
                    paragraphIndex: 49,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-14-2",
                    title: "14.2 Mediation",
                    content: [
                        "If negotiations fail, the parties agree to submit the dispute to binding mediation before a mutually agreed-upon mediator."
                    ],
                    level: 2,
                    paragraphIndex: 50,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-14-3",
                    title: "14.3 Arbitration",
                    content: [
                        "Any disputes not resolved through mediation shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association."
                    ],
                    level: 2,
                    paragraphIndex: 51,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-15",
            title: "15. GOVERNING LAW",
            content: [],
            level: 1,
            paragraphIndex: 52,
            expanded: false,
            subsections: [
                {
                    id: "section-15-1",
                    title: "15.1 Applicable Law",
                    content: [
                        "This Agreement shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles."
                    ],
                    level: 2,
                    paragraphIndex: 53,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-15-2",
                    title: "15.2 Jurisdiction",
                    content: [
                        "Any legal proceedings shall be brought in the state or federal courts located in San Francisco County, California."
                    ],
                    level: 2,
                    paragraphIndex: 54,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-16",
            title: "16. COMPLIANCE AND REGULATORY REQUIREMENTS",
            content: [],
            level: 1,
            paragraphIndex: 55,
            expanded: false,
            subsections: [
                {
                    id: "section-16-1",
                    title: "16.1 Data Protection",
                    content: [
                        "Developer shall implement appropriate security measures to protect personal data and shall comply with all applicable data protection regulations, including GDPR and CCPA."
                    ],
                    level: 2,
                    paragraphIndex: 56,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-16-2",
                    title: "16.2 Industry Standards",
                    content: [
                        "The work product shall comply with relevant industry standards and best practices for software security and accessibility."
                    ],
                    level: 2,
                    paragraphIndex: 57,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-16-3",
                    title: "16.3 Regulatory Compliance",
                    content: [
                        "Developer shall ensure that the work product complies with all applicable laws and regulations governing the Company's industry."
                    ],
                    level: 2,
                    paragraphIndex: 58,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-17",
            title: "17. ASSIGNMENT AND SUBCONTRACTING",
            content: [],
            level: 1,
            paragraphIndex: 59,
            expanded: false,
            subsections: [
                {
                    id: "section-17-1",
                    title: "17.1 Assignment Restrictions",
                    content: [
                        "Neither party may assign this Agreement without the prior written consent of the other party, except that Company may assign this Agreement to an affiliate or in connection with a merger or acquisition."
                    ],
                    level: 2,
                    paragraphIndex: 60,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-17-2",
                    title: "17.2 Subcontracting",
                    content: [
                        "Developer may engage subcontractors to perform portions of the work, provided that Developer remains fully responsible for all work performed and such subcontractors are bound by equivalent confidentiality obligations."
                    ],
                    level: 2,
                    paragraphIndex: 61,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-18",
            title: "18. NOTICES",
            content: [],
            level: 1,
            paragraphIndex: 62,
            expanded: false,
            subsections: [
                {
                    id: "section-18-1",
                    title: "18.1 Notice Requirements",
                    content: [
                        "All notices under this Agreement shall be in writing and shall be deemed given when delivered personally, by overnight courier, or by certified mail, return receipt requested."
                    ],
                    level: 2,
                    paragraphIndex: 63,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-18-2",
                    title: "18.2 Notice Addresses",
                    content: [
                        "Notices to Company shall be sent to the address set forth in the preamble, attention: Chief Technology Officer.",
                        "Notices to Developer shall be sent to the address set forth in the preamble, attention: Project Manager."
                    ],
                    level: 2,
                    paragraphIndex: 64,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-19",
            title: "19. MISCELLANEOUS PROVISIONS",
            content: [],
            level: 1,
            paragraphIndex: 65,
            expanded: false,
            subsections: [
                {
                    id: "section-19-1",
                    title: "19.1 Entire Agreement",
                    content: [
                        "This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, and agreements relating to the subject matter hereof."
                    ],
                    level: 2,
                    paragraphIndex: 66,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-19-2",
                    title: "19.2 Amendments",
                    content: [
                        "This Agreement may only be amended by written instrument signed by both parties."
                    ],
                    level: 2,
                    paragraphIndex: 67,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-19-3",
                    title: "19.3 Severability",
                    content: [
                        "If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect."
                    ],
                    level: 2,
                    paragraphIndex: 68,
                    expanded: false,
                    subsections: []
                },
                {
                    id: "section-19-4",
                    title: "19.4 Counterparts",
                    content: [
                        "This Agreement may be executed in counterparts, each of which shall be deemed an original and all of which together shall constitute one and the same instrument."
                    ],
                    level: 2,
                    paragraphIndex: 69,
                    expanded: false,
                    subsections: []
                }
            ]
        },
        {
            id: "section-20",
            title: "20. SIGNATURES",
            content: [
                "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.",
                "TECHCORP SOLUTIONS, INC.",
                "By: _________________________________",
                "Name: Sarah Johnson",
                "Title: Chief Technology Officer",
                "Date: January 15, 2024",
                "DIGITAL INNOVATIONS LLC",
                "By: _________________________________",
                "Name: Michael Chen",
                "Title: Managing Partner",
                "Date: January 15, 2024"
            ],
            level: 1,
            paragraphIndex: 70,
            expanded: false,
            subsections: []
        }
    ]
};

// Function to load sample data
async function loadSampleData() {
    try {
        const response = await fetch('http://localhost:3001/api/document-sections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sampleContractData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Sample data loaded successfully:', result);
            return result;
        } else {
            console.error('Failed to load sample data');
            return null;
        }
    } catch (error) {
        console.error('Error loading sample data:', error);
        return null;
    }
}

// Run if this file is executed directly
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    loadSampleData();
} else {
    // Browser environment
    window.loadSampleData = loadSampleData;
}

module.exports = { sampleContractData, loadSampleData }; 