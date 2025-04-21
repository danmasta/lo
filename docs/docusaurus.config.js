export default {
    title: 'Lo',
    tagline: 'Lightweight, modern utility library for node, browser, and quickjs',
    favicon: 'img/favicon.ico',
    url: 'https://danmasta.github.io',
    baseUrl: '/lo/',
    organizationName: 'danmasta',
    projectName: 'lo',
    onBrokenLinks: 'warn',
    onBrokenMarkdownLinks: 'throw',
    i18n: {
        defaultLocale: 'en',
        locales: [
            'en'
        ]
    },
    presets: [
        [
            '@docusaurus/preset-classic', {
                docs: {
                    routeBasePath: '/',
                    sidebarPath: 'sidebars.js',
                    editUrl: 'https://github.com/danmasta/lo/tree/master/docs'
                },
                blog: false,
                theme: {
                    customCss: 'src/css/custom.css'
                }
            }
        ]
    ],
    themeConfig: {
        image: 'img/docusaurus-social-card.jpg',
        navbar: {
            title: 'Lo',
            items: [
                {
                    type: 'docSidebar',
                    sidebarId: 'docsSidebar',
                    position: 'left',
                    label: 'Documentation'
                },
                {
                    href: 'https://github.com/danmasta/lo',
                    label: 'GitHub',
                    position: 'right'
                }
            ]
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Docs',
                    items: [
                        {
                            label: 'About',
                            to: 'about'
                        },
                        {
                            label: 'Types',
                            to: 'types'
                        },
                        {
                            label: 'Reference',
                            to: 'reference'
                        }
                    ]
                },
                {
                    title: 'Community',
                    items: [
                        {
                            label: 'GitHub Discussions',
                            href: 'https://github.com/danmasta/lo/discussions'
                        }
                    ]
                },
                {
                    title: 'More',
                    items: [
                        {
                            label: 'GitHub',
                            href: 'https://github.com/danmasta/lo'
                        }
                    ]
                }
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Daniel Smith`
        },
        prism: {
        }
    }
};
