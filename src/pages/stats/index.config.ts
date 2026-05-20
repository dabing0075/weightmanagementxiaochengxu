export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '统计分析',
      navigationBarBackgroundColor: '#F7F4ED',
      navigationBarTextStyle: 'black'
    })
  : {
      navigationBarTitleText: '统计分析',
      navigationBarBackgroundColor: '#F7F4ED',
      navigationBarTextStyle: 'black'
    }
