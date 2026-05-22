export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '编辑个人信息' })
  : { navigationBarTitleText: '编辑个人信息' }
