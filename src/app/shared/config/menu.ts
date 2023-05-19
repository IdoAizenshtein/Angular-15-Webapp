export const menu: any = {
    customers: [
        {
            main: 'cfl',
            text: 'menu.customers.general',
            routerLink: './general',
            img: {
                src: 'customers.general',
                alt: 'general'
            },
            children: []
        },
        {
            main: 'financialManagement',
            text: 'menu.customers.financialManagement.parent',
            img: {
                src: 'customers.financialManagement',
                alt: 'financialManagement'
            },
            children: [
                {
                    routerLink: './financialManagement/bankAccount',
                    text: 'menu.customers.financialManagement.bankAccount.main'
                },
                {
                    routerLink: './financialManagement/creditsCard',
                    text: 'menu.customers.financialManagement.creditsCard.main'
                },
                {
                    routerLink: './financialManagement/checks',
                    text: 'menu.customers.financialManagement.checks.main'
                },
                {
                    routerLink: './financialManagement/slika',
                    text: 'menu.customers.financialManagement.slika.main'
                },
                {
                    routerLink: './financialManagement/beneficiary',
                    text: 'menu.customers.financialManagement.beneficiary.main'
                }
            ]
        },
        {
            main: 'cash-flow',
            text: 'menu.customers.tazrim.parent',
            img: {
                src: 'customers.tazrim',
                alt: 'tazrim'
            },
            children: [
                {
                    routerLink: './cash-flow/daily',
                    text: 'menu.customers.tazrim.daily'
                },
                {
                    routerLink: './cash-flow/bankmatch',
                    text: 'menu.customers.tazrim.bankmatch'
                },
                {
                    routerLink: './cash-flow/fixedMovements',
                    text: 'menu.customers.tazrim.fixedMovements'
                }
            ]
        },
        {
            main: 'budget',
            text: 'menu.customers.budget',
            routerLink: './budget',
            img: {
                src: 'budget',
                alt: 'budget'
            },
            children: []
        },
        {
            main: 'accountancy',
            text: 'menu.customers.accountancy.parent',
            routerLink: './accountancy',
            img: {
                src: 'customers.accountancy',
                alt: 'accountancy'
            },
            children: [
                {
                    routerLink: './accountancy/bookKeepingAnalyze',
                    text: 'menu.customers.accountancy.bookKeepingAnalyze'
                },
                {
                    routerLink: './accountancy/profitAndLoss',
                    text: 'menu.customers.accountancy.profitAndLoss'
                },
                {
                    routerLink: './accountancy/trialBalance',
                    text: 'menu.customers.accountancy.trialBalance'
                }
            ]
        },
        {
            main: 'knowledge-base',
            text: 'menu.customers.knowledge-base',
            routerLink: './help-center',
            img: {
                src: 'knowledge-base',
                alt: 'knowledge-base'
            },
            children: []
        },
        {
            main: 'settings',
            text: 'actions.settings',
            routerLink: './settings',
            img: {
                src: 'settings',
                alt: 'settings'
            },
            children: []
        }
    ],
    customersLite: [
        {
            main: 'cfl',
            text: 'menu.customers.general',
            routerLink: './general',
            img: {
                src: 'customers.general',
                alt: 'general'
            },
            children: []
        },
        {
            main: 'financialManagement',
            routerLink: './financialManagement/bankAccount',
            text: 'menu.customers.financialManagement.bankAccount.main',
            img: {
                src: 'customers.financialManagement',
                alt: 'financialManagement'
            },
            children: []
        },
        {
            main: 'financialManagement',
            routerLink: './financialManagement/creditsCard',
            text: 'menu.customers.financialManagement.creditsCard.main',
            img: {
                src: 'credirCardIcon',
                alt: 'creditsCard'
            },
            children: []
        },
        {
            main: 'financialManagement',
            routerLink: './financialManagement/checks',
            text: 'menu.customers.financialManagement.checks.main',
            img: {
                src: 'checksIcon',
                alt: 'checks'
            },
            children: []
        },
        {
            main: 'financialManagement',
            routerLink: './financialManagement/slika',
            text: 'menu.customers.financialManagement.slika.main',
            img: {
                src: 'slikaIcon',
                alt: 'slika'
            },
            children: []
        },
        {
            main: 'financialManagement',
            routerLink: './financialManagement/beneficiary',
            text: 'menu.customers.financialManagement.beneficiary.main',
            img: {
                src: 'mutavimIcon',
                alt: 'beneficiary'
            },
            children: []
        },
        {
            main: 'budget',
            text: 'menu.customers.budget',
            routerLink: './budget',
            img: {
                src: 'budget',
                alt: 'budget'
            },
            children: []
        },
        {
            main: 'cash-flow',
            routerLink: './packages',
            text: 'menu.customers.tazrim.parent',
            img: {
                src: 'customers.tazrim',
                alt: 'tazrim'
            },
            children: [],
            notActive: true
        },
        {
            main: 'knowledge-base',
            text: 'menu.customers.knowledge-base',
            routerLink: './help-center',
            img: {
                src: 'knowledge-base',
                alt: 'knowledge-base'
            },
            children: []
        },
        {
            main: 'settings',
            text: 'actions.settings',
            routerLink: './settings',
            img: {
                src: 'settings',
                alt: 'settings'
            },
            children: []
        }
    ],
    accountants: [
        {
            main: 'main',
            isForceUnSelectedCompany: true,
            text: 'menu.accountants.main.parent',
            routerLink: './main',
            img: {
                svg: true,
                src: 'mainNav',
                alt: 'main'
            },
            children: []
        },
        {
            main: 'companies',
            isForceUnSelectedCompany: true,
            text: 'menu.accountants.companies.parent',
            routerLink: './companies',
            img: {
                svg: true,
                src: 'companiesNav',
                alt: 'companies'
            },
            children: []
        },
        {
            main: 'bankExport',
            isForceUnSelectedCompany: true,
            text: 'menu.accountants.companies.bankExport',
            routerLink: './companies/bankExport',
            img: {
                svg: true,
                src: 'bankExportNav',
                alt: 'reports'
            },
            children: []
        },
        {
            main: 'companies',
            text: 'companies',
            img: {
                svg: true,
                src: 'bagNav',
                alt: 'companies'
            },
            children: [
                {
                    routerLink: './companies/general',
                    text: 'menu.accountants.companies.general',
                    children: []
                },
                {
                    routerLink: './companies/archives',
                    text: 'menu.accountants.companies.archives',
                    children: []
                },
                {
                    routerLink: './companies/journalTrans/suppliersAndCustomers',
                    text: 'menu.accountants.companies.supplierCustomersJournal',
                    isJournalTrans: true,
                    children: []
                },
                {
                    routerLink: './companies/journalTrans/bankAndCredit',
                    text: 'menu.accountants.companies.bankCreditJournal',
                    isBankTrans: true,
                    children: []
                },
                {
                    main: 'financialManagement',
                    text: 'menu.customers.financialManagement.parent',
                    img: {
                        src: 'customers.financialManagement',
                        alt: 'financialManagement'
                    },
                    children: [
                        {
                            routerLink: './companies/financialManagement/bankAccount',
                            text: 'menu.customers.financialManagement.bankAccount.main'
                        },
                        {
                            routerLink: './companies/financialManagement/creditsCard',
                            text: 'menu.customers.financialManagement.creditsCard.main'
                        }
                    ]
                },
                {
                    main: 'cash-flow',
                    text: 'menu.customers.tazrim.parent',
                    img: {
                        src: 'customers.tazrim',
                        alt: 'tazrim'
                    },
                    children: [
                        {
                            routerLink: './companies/cash-flow/daily',
                            text: 'menu.customers.tazrim.daily'
                        },
                        {
                            routerLink: './companies/cash-flow/bankmatch',
                            text: 'menu.customers.tazrim.bankmatch'
                        },
                        {
                            routerLink: './companies/cash-flow/fixedMovements',
                            text: 'menu.customers.tazrim.fixedMovements'
                        }
                    ]
                },
                {
                    main: 'accountancy',
                    text: 'menu.customers.accountancy.parent',
                    routerLink: './companies/accountancy',
                    img: {
                        src: 'customers.accountancy',
                        alt: 'accountancy'
                    },
                    children: [
                        {
                            routerLink: './companies/accountancy/bookKeepingAnalyze',
                            text: 'menu.customers.accountancy.bookKeepingAnalyze'
                        },
                        {
                            routerLink: './companies/accountancy/profitAndLoss',
                            text: 'menu.customers.accountancy.profitAndLoss'
                        },
                        {
                            routerLink: './companies/accountancy/trialBalance',
                            text: 'menu.customers.accountancy.trialBalance'
                        }
                    ]
                }
            ]
        },
        {
            main: 'supplierCustomersJournal',
            text: 'menu.accountants.companies.supplierCustomersJournal',
            routerLink: './companies/supplierCustomersJournal',
            img: {
                svg: true,
                src: 'journalTransNav',
                alt: 'reports'
            },
            children: []
        },
        {
            main: 'bankCreditJournal',
            text: 'menu.accountants.companies.bankCreditJournal',
            routerLink: './companies/bankCreditJournal',
            img: {
                svg: true,
                src: 'journalTransNav',
                alt: 'reports'
            },
            children: []
        },
        {
            main: 'reports',
            text: 'menu.accountants.reports.parent',
            routerLink: './reports',
            img: {
                svg: true,
                src: 'reportNav',
                alt: 'reports'
            },
            children: []
        },
        {
            main: 'accountingFirmEstablishment',
            text: 'menu.accountants.accountingFirmEstablishment.parent',
            routerLink: './companies/accountingFirmEstablishment',
            img: {
                svg: true,
                src: 'reportNav',
                alt: 'reports'
            },
            children: []
        }
    ],
    accountantsLite: [
        {
            main: 'main',
            isForceUnSelectedCompany: true,
            text: 'menu.accountants.main.parent',
            routerLink: './main',
            img: {
                svg: true,
                src: 'mainNav',
                alt: 'main'
            },
            children: []
        },
        {
            main: 'companies',
            isForceUnSelectedCompany: true,
            text: 'menu.accountants.companies.parent',
            routerLink: './companies',
            img: {
                svg: true,
                src: 'companiesNav',
                alt: 'companies'
            },
            children: []
        },
        {
            main: 'bankExport',
            isForceUnSelectedCompany: true,
            text: 'menu.accountants.companies.bankExport',
            routerLink: './companies/bankExport',
            img: {
                svg: true,
                src: 'bankExportNav',
                alt: 'reports'
            },
            children: []
        },
        {
            main: 'companies',
            text: 'companies',
            img: {
                svg: true,
                src: 'bagNav',
                alt: 'companies'
            },
            children: [
                {
                    routerLink: './companies/general',
                    text: 'menu.accountants.companies.general',
                    children: []
                },
                {
                    routerLink: './companies/archives',
                    text: 'menu.accountants.companies.archives',
                    children: []
                },
                {
                    routerLink: './companies/journalTrans/suppliersAndCustomers',
                    isJournalTrans: true,
                    text: 'menu.accountants.companies.supplierCustomersJournal',
                    children: []
                },
                {
                    routerLink: './companies/journalTrans/bankAndCredit',
                    isBankTrans: true,
                    text: 'menu.accountants.companies.bankCreditJournal',
                    children: []
                },
                {
                    main: 'financialManagement',
                    routerLink: './companies/financialManagement/bankAccount',
                    text: 'menu.customers.financialManagement.bankAccount.main',
                    img: {
                        src: 'customers.financialManagement',
                        alt: 'financialManagement'
                    },
                    children: []
                },
                {
                    main: 'financialManagement',
                    routerLink: './companies/financialManagement/creditsCard',
                    text: 'menu.customers.financialManagement.creditsCard.main',
                    img: {
                        src: 'credirCardIcon',
                        alt: 'creditsCard'
                    },
                    children: []
                },
                {
                    main: 'cash-flow',
                    routerLink: './companies/packages',
                    text: 'menu.customers.tazrim.parent',
                    img: {
                        src: 'customers.tazrim',
                        alt: 'tazrim'
                    },
                    children: [],
                    notActive: true
                }
            ]
        },
        {
            main: 'supplierCustomersJournal',
            text: 'menu.accountants.companies.supplierCustomersJournal',
            routerLink: './companies/supplierCustomersJournal',
            img: {
                svg: true,
                src: 'journalTransNav',
                alt: 'reports'
            },
            children: []
        },
        {
            main: 'bankCreditJournal',
            text: 'menu.accountants.companies.bankCreditJournal',
            routerLink: './companies/bankCreditJournal',
            img: {
                svg: true,
                src: 'journalTransNav',
                alt: 'reports'
            },
            children: []
        },
        {
            main: 'reports',
            text: 'menu.accountants.reports.parent',
            routerLink: './reports',
            img: {
                svg: true,
                src: 'reportNav',
                alt: 'reports'
            },
            children: []
        },
        {
            main: 'accountingFirmEstablishment',
            text: 'menu.accountants.accountingFirmEstablishment.parent',
            routerLink: './companies/accountingFirmEstablishment',
            img: {
                svg: true,
                src: 'reportNav',
                alt: 'reports'
            },
            children: []
        }
    ],
    METZALEM_close: [
        // {
        //     'main': 'archives',
        //     'routerLink': './archives',
        //     'text': 'menu.accountants.companies.archivesDocs',
        //     'img': {
        //         'svg': true,
        //         'src': 'bagNav',
        //         'alt': 'companies'
        //     },
        //     'children': []
        // },
        {
            main: 'documentManagement',
            routerLink: './documentManagement/archives',
            text: 'menu.accountants.companies.archivesDocs',
            img: {
                svg: true,
                src: 'bagNav',
                alt: 'companies'
            },
            children: []
        },
        {
            main: 'tazrimExample',
            text: 'menu.accountants.companies.tazrimExample',
            routerLink: './tazrimExample',
            img: {
                liteDiamondIcon: true
            },
            children: [
                {
                    main: 'cfl',
                    text: 'menu.customers.general',
                    routerLink: './general',
                    img: {
                        src: 'customers.general',
                        alt: 'general'
                    },
                    children: []
                },
                {
                    main: 'financialManagement',
                    text: 'menu.customers.financialManagement.parent',
                    img: {
                        src: 'customers.financialManagement',
                        alt: 'financialManagement'
                    },
                    children: [
                        {
                            routerLink: './financialManagement/bankAccount',
                            text: 'menu.customers.financialManagement.bankAccount.main'
                        },
                        {
                            routerLink: './financialManagement/creditsCard',
                            text: 'menu.customers.financialManagement.creditsCard.main'
                        },
                        {
                            routerLink: './financialManagement/checks',
                            text: 'menu.customers.financialManagement.checks.main'
                        },
                        {
                            routerLink: './financialManagement/slika',
                            text: 'menu.customers.financialManagement.slika.main'
                        },
                        {
                            routerLink: './financialManagement/beneficiary',
                            text: 'menu.customers.financialManagement.beneficiary.main'
                        }
                    ]
                },
                {
                    main: 'cash-flow',
                    text: 'menu.customers.tazrim.parent',
                    img: {
                        src: 'customers.tazrim',
                        alt: 'tazrim'
                    },
                    children: [
                        {
                            routerLink: './cash-flow/daily',
                            text: 'menu.customers.tazrim.daily'
                        },
                        {
                            routerLink: './cash-flow/bankmatch',
                            text: 'menu.customers.tazrim.bankmatch'
                        },
                        {
                            routerLink: './cash-flow/fixedMovements',
                            text: 'menu.customers.tazrim.fixedMovements'
                        }
                    ]
                }
            ]
        }
    ],
    METZALEM_open: [
        {
            main: 'cfl',
            text: 'menu.customers.general',
            routerLink: './general',
            img: {
                src: 'customers.general',
                alt: 'general'
            },
            children: []
        },
        {
            main: 'financialManagement',
            text: 'menu.customers.financialManagement.parent',
            img: {
                src: 'customers.financialManagement',
                alt: 'financialManagement'
            },
            children: [
                {
                    routerLink: './financialManagement/bankAccount',
                    text: 'menu.customers.financialManagement.bankAccount.main'
                },
                {
                    routerLink: './financialManagement/creditsCard',
                    text: 'menu.customers.financialManagement.creditsCard.main'
                },
                {
                    routerLink: './financialManagement/checks',
                    text: 'menu.customers.financialManagement.checks.main'
                },
                {
                    routerLink: './financialManagement/slika',
                    text: 'menu.customers.financialManagement.slika.main'
                },
                {
                    routerLink: './financialManagement/beneficiary',
                    text: 'menu.customers.financialManagement.beneficiary.main'
                }
            ]
        },
        {
            main: 'cash-flow',
            text: 'menu.customers.tazrim.parent',
            img: {
                src: 'customers.tazrim',
                alt: 'tazrim'
            },
            children: [
                {
                    routerLink: './cash-flow/daily',
                    text: 'menu.customers.tazrim.daily'
                },
                {
                    routerLink: './cash-flow/bankmatch',
                    text: 'menu.customers.tazrim.bankmatch'
                },
                {
                    routerLink: './cash-flow/fixedMovements',
                    text: 'menu.customers.tazrim.fixedMovements'
                }
            ]
        },
        {
            main: 'settings',
            text: 'actions.settings',
            routerLink: './settings',
            img: {
                svg: true,
                src: 'settingsNav',
                alt: 'settings'
            },
            children: []
        },
        {
            main: 'knowledge-base',
            text: 'menu.customers.knowledge-base',
            routerLink: './help-center',
            img: {
                src: 'knowledge-base',
                alt: 'knowledge-base'
            },
            children: []
        },
        {
            main: 'documentManagement',
            routerLink: './documentManagement/archives',
            text: 'menu.accountants.companies.archivesDocs',
            img: {
                svg: true,
                src: 'bagNav',
                alt: 'companies'
            },
            children: []
        }
    ],
    METZALEM_KSAFIM: [
        {
            main: 'cfl',
            text: 'menu.customers.general',
            routerLink: './general',
            img: {
                src: 'customers.general',
                alt: 'general'
            },
            children: []
        },
        {
            main: 'financialManagement',
            text: 'menu.customers.financialManagement.parent',
            img: {
                src: 'customers.financialManagement',
                alt: 'financialManagement'
            },
            children: [
                {
                    routerLink: './financialManagement/bankAccount',
                    text: 'menu.customers.financialManagement.bankAccount.main'
                },
                {
                    routerLink: './financialManagement/creditsCard',
                    text: 'menu.customers.financialManagement.creditsCard.main'
                },
                {
                    routerLink: './financialManagement/checks',
                    text: 'menu.customers.financialManagement.checks.main'
                },
                {
                    routerLink: './financialManagement/slika',
                    text: 'menu.customers.financialManagement.slika.main'
                },
                {
                    routerLink: './financialManagement/beneficiary',
                    text: 'menu.customers.financialManagement.beneficiary.main'
                }
            ]
        },
        {
            main: 'cash-flow',
            text: 'menu.customers.tazrim.parent',
            img: {
                src: 'customers.tazrim',
                alt: 'tazrim'
            },
            children: [
                {
                    routerLink: './cash-flow/daily',
                    text: 'menu.customers.tazrim.daily'
                },
                {
                    routerLink: './cash-flow/bankmatch',
                    text: 'menu.customers.tazrim.bankmatch'
                },
                {
                    routerLink: './cash-flow/fixedMovements',
                    text: 'menu.customers.tazrim.fixedMovements'
                }
            ]
        },
        {
            main: 'budget',
            text: 'menu.customers.budget',
            routerLink: './budget',
            img: {
                src: 'budget',
                alt: 'budget'
            },
            children: []
        },
        {
            main: 'knowledge-base',
            text: 'menu.customers.knowledge-base',
            routerLink: './help-center',
            img: {
                src: 'knowledge-base',
                alt: 'knowledge-base'
            },
            children: []
        },
        {
            main: 'settings',
            text: 'actions.settings',
            routerLink: './settings',
            img: {
                svg: true,
                src: 'settingsNav',
                alt: 'settings'
            },
            children: []
        },
        {
            main: 'documentManagement',
            routerLink: './documentManagement/archives',
            text: 'menu.accountants.companies.archivesDocs',
            img: {
                svg: true,
                src: 'bagNav',
                alt: 'companies'
            },
            children: []
        }
    ],
    METZALEM_KSAFIM_ANHALATHESHBONOT: [
        {
            main: 'cfl',
            text: 'menu.customers.general',
            routerLink: './general',
            img: {
                src: 'customers.general',
                alt: 'general'
            },
            children: []
        },
        {
            main: 'financialManagement',
            text: 'menu.customers.financialManagement.parent',
            img: {
                src: 'customers.financialManagement',
                alt: 'financialManagement'
            },
            children: [
                {
                    routerLink: './financialManagement/bankAccount',
                    text: 'menu.customers.financialManagement.bankAccount.main'
                },
                {
                    routerLink: './financialManagement/creditsCard',
                    text: 'menu.customers.financialManagement.creditsCard.main'
                },
                {
                    routerLink: './financialManagement/checks',
                    text: 'menu.customers.financialManagement.checks.main'
                },
                {
                    routerLink: './financialManagement/slika',
                    text: 'menu.customers.financialManagement.slika.main'
                },
                {
                    routerLink: './financialManagement/beneficiary',
                    text: 'menu.customers.financialManagement.beneficiary.main'
                }
            ]
        },
        {
            main: 'cash-flow',
            text: 'menu.customers.tazrim.parent',
            img: {
                src: 'customers.tazrim',
                alt: 'tazrim'
            },
            children: [
                {
                    routerLink: './cash-flow/daily',
                    text: 'menu.customers.tazrim.daily'
                },
                {
                    routerLink: './cash-flow/bankmatch',
                    text: 'menu.customers.tazrim.bankmatch'
                },
                {
                    routerLink: './cash-flow/fixedMovements',
                    text: 'menu.customers.tazrim.fixedMovements'
                }
            ]
        },
        {
            main: 'budget',
            text: 'menu.customers.budget',
            routerLink: './budget',
            img: {
                src: 'budget',
                alt: 'budget'
            },
            children: []
        },
        {
            main: 'accountancy',
            text: 'menu.customers.accountancy.parent',
            routerLink: './accountancy',
            img: {
                src: 'customers.accountancy',
                alt: 'accountancy'
            },
            children: [
                {
                    routerLink: './accountancy/bookKeepingAnalyze',
                    text: 'menu.customers.accountancy.bookKeepingAnalyze'
                },
                {
                    routerLink: './accountancy/profitAndLoss',
                    text: 'menu.customers.accountancy.profitAndLoss'
                },
                {
                    routerLink: './accountancy/trialBalance',
                    text: 'menu.customers.accountancy.trialBalance'
                }
            ]
        },
        {
            main: 'knowledge-base',
            text: 'menu.customers.knowledge-base',
            routerLink: './help-center',
            img: {
                src: 'knowledge-base',
                alt: 'knowledge-base'
            },
            children: []
        },
        {
            main: 'settings',
            text: 'actions.settings',
            routerLink: './settings',
            img: {
                svg: true,
                src: 'settingsNav',
                alt: 'settings'
            },
            children: []
        },
        {
            main: 'documentManagement',
            routerLink: './documentManagement/archives',
            text: 'menu.accountants.companies.archivesDocs',
            img: {
                svg: true,
                src: 'bagNav',
                alt: 'companies'
            },
            children: []
        }
    ],
    METZALEM_close_accountancy: [
        {
            main: 'documentManagement',
            routerLink: './documentManagement/archives',
            text: 'menu.accountants.companies.archivesDocs',
            img: {
                svg: true,
                src: 'bagNav',
                alt: 'companies'
            },
            children: []
        },
        {
            main: 'tazrimExample',
            text: 'menu.accountants.companies.tazrimExample',
            routerLink: './tazrimExample',
            img: {
                liteDiamondIcon: true
            },
            children: [
                {
                    main: 'cfl',
                    text: 'menu.customers.general',
                    routerLink: './general',
                    img: {
                        src: 'customers.general',
                        alt: 'general'
                    },
                    children: []
                },
                {
                    main: 'financialManagement',
                    text: 'menu.customers.financialManagement.parent',
                    img: {
                        src: 'customers.financialManagement',
                        alt: 'financialManagement'
                    },
                    children: [
                        {
                            routerLink: './financialManagement/bankAccount',
                            text: 'menu.customers.financialManagement.bankAccount.main'
                        },
                        {
                            routerLink: './financialManagement/creditsCard',
                            text: 'menu.customers.financialManagement.creditsCard.main'
                        },
                        {
                            routerLink: './financialManagement/checks',
                            text: 'menu.customers.financialManagement.checks.main'
                        },
                        {
                            routerLink: './financialManagement/slika',
                            text: 'menu.customers.financialManagement.slika.main'
                        },
                        {
                            routerLink: './financialManagement/beneficiary',
                            text: 'menu.customers.financialManagement.beneficiary.main'
                        }
                    ]
                },
                {
                    main: 'cash-flow',
                    text: 'menu.customers.tazrim.parent',
                    img: {
                        src: 'customers.tazrim',
                        alt: 'tazrim'
                    },
                    children: [
                        {
                            routerLink: './cash-flow/daily',
                            text: 'menu.customers.tazrim.daily'
                        },
                        {
                            routerLink: './cash-flow/bankmatch',
                            text: 'menu.customers.tazrim.bankmatch'
                        },
                        {
                            routerLink: './cash-flow/fixedMovements',
                            text: 'menu.customers.tazrim.fixedMovements'
                        }
                    ]
                }
            ]
        },
        {
            main: 'accountancy',
            text: 'menu.customers.accountancy.parent',
            routerLink: './accountancy',
            img: {
                src: 'customers.accountancy',
                alt: 'accountancy'
            },
            children: [
                {
                    routerLink: './accountancy/bookKeepingAnalyze',
                    text: 'menu.customers.accountancy.bookKeepingAnalyze'
                },
                {
                    routerLink: './accountancy/profitAndLoss',
                    text: 'menu.customers.accountancy.profitAndLoss'
                },
                {
                    routerLink: './accountancy/trialBalance',
                    text: 'menu.customers.accountancy.trialBalance'
                }
            ]
        }
    ],
    METZALEM_open_accountancy: [
        {
            main: 'cfl',
            text: 'menu.customers.general',
            routerLink: './general',
            img: {
                src: 'customers.general',
                alt: 'general'
            },
            children: []
        },
        {
            main: 'financialManagement',
            text: 'menu.customers.financialManagement.parent',
            img: {
                src: 'customers.financialManagement',
                alt: 'financialManagement'
            },
            children: [
                {
                    routerLink: './financialManagement/bankAccount',
                    text: 'menu.customers.financialManagement.bankAccount.main'
                },
                {
                    routerLink: './financialManagement/creditsCard',
                    text: 'menu.customers.financialManagement.creditsCard.main'
                },
                {
                    routerLink: './financialManagement/checks',
                    text: 'menu.customers.financialManagement.checks.main'
                },
                {
                    routerLink: './financialManagement/slika',
                    text: 'menu.customers.financialManagement.slika.main'
                },
                {
                    routerLink: './financialManagement/beneficiary',
                    text: 'menu.customers.financialManagement.beneficiary.main'
                }
            ]
        },
        {
            main: 'cash-flow',
            text: 'menu.customers.tazrim.parent',
            img: {
                src: 'customers.tazrim',
                alt: 'tazrim'
            },
            children: [
                {
                    routerLink: './cash-flow/daily',
                    text: 'menu.customers.tazrim.daily'
                },
                {
                    routerLink: './cash-flow/bankmatch',
                    text: 'menu.customers.tazrim.bankmatch'
                },
                {
                    routerLink: './cash-flow/fixedMovements',
                    text: 'menu.customers.tazrim.fixedMovements'
                }
            ]
        },
        {
            main: 'settings',
            text: 'actions.settings',
            routerLink: './settings',
            img: {
                svg: true,
                src: 'settingsNav',
                alt: 'settings'
            },
            children: []
        },
        {
            main: 'documentManagement',
            routerLink: './documentManagement/archives',
            text: 'menu.accountants.companies.archivesDocs',
            img: {
                svg: true,
                src: 'bagNav',
                alt: 'companies'
            },
            children: []
        },
        {
            main: 'accountancy',
            text: 'menu.customers.accountancy.parent',
            routerLink: './accountancy',
            img: {
                src: 'customers.accountancy',
                alt: 'accountancy'
            },
            children: [
                {
                    routerLink: './accountancy/bookKeepingAnalyze',
                    text: 'menu.customers.accountancy.bookKeepingAnalyze'
                },
                {
                    routerLink: './accountancy/profitAndLoss',
                    text: 'menu.customers.accountancy.profitAndLoss'
                },
                {
                    routerLink: './accountancy/trialBalance',
                    text: 'menu.customers.accountancy.trialBalance'
                }
            ]
        }
    ]
};
