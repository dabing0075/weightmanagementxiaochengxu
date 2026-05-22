export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '数据分析',
    })
  : {
      navigationBarTitleText: '数据分析',
    }
