export default defineAppConfig({
  lazyCodeLoading: 'requiredComponents',
  pages: [
    'pages/bar/index',
    'pages/me/index',
    'pages/recipe/index',
    'pages/calendar/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#214e3a',
    navigationBarTitleText: 'HomeBar',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f6f2e9'
  },
  tabBar: {
    color: '#8b9086',
    selectedColor: '#214e3a',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/bar/index',
        text: 'Bar',
        iconPath: 'assets/tabbar/bar.png',
        selectedIconPath: 'assets/tabbar/bar-selected.png'
      },
      {
        pagePath: 'pages/me/index',
        text: 'Me',
        iconPath: 'assets/tabbar/me.png',
        selectedIconPath: 'assets/tabbar/me-selected.png'
      }
    ]
  }
})
