export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '趋势分析',
    })
  : {
      navigationBarTitleText: '趋势分析',
    }
