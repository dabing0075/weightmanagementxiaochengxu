export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '靓健体重日记' })
  : { navigationBarTitleText: '靓健体重日记' }
