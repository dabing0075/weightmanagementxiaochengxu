export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '个人中心',
      navigationBarBackgroundColor: '#E4DED2',
      navigationBarTextStyle: 'black'
    })
  : {
      navigationBarTitleText: '个人中心',
      navigationBarBackgroundColor: '#E4DED2',
      navigationBarTextStyle: 'black'
    }
