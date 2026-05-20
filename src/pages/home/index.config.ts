export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '首页',
      navigationBarBackgroundColor: '#F26B3A',
      navigationBarTextStyle: 'white'
    })
  : {
      navigationBarTitleText: '首页',
      navigationBarBackgroundColor: '#F26B3A',
      navigationBarTextStyle: 'white'
    }
