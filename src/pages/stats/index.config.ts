export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '统计分析',
    })
  : {
      navigationBarTitleText: '统计分析',
    }
