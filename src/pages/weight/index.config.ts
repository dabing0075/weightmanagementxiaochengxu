export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '体重管理',
    })
  : {
      navigationBarTitleText: '体重管理',
    }
