export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '健康管理',
    })
  : {
      navigationBarTitleText: '健康管理',
    }
