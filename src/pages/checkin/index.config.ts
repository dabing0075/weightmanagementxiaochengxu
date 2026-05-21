export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '记录数据',
    })
  : {
      navigationBarTitleText: '记录数据',
    }
