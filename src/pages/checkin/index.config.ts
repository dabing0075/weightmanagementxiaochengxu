export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '打卡',
      navigationBarBackgroundColor: '#F7F4ED',
      navigationBarTextStyle: 'black'
    })
  : {
      navigationBarTitleText: '打卡',
      navigationBarBackgroundColor: '#F7F4ED',
      navigationBarTextStyle: 'black'
    }
