export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '趋势分析',
      navigationBarBackgroundColor: '#F7F4ED',
      navigationBarTextStyle: 'black'
    })
  : {
      navigationBarTitleText: '趋势分析',
      navigationBarBackgroundColor: '#F7F4ED',
      navigationBarTextStyle: 'black'
    }
