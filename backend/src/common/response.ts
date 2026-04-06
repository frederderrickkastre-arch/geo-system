export function success(data: any = null, msg = 'success') {
  return { code: 200, msg, data }
}

export function error(msg = '操作失败', code = 400) {
  return { code, msg, data: null }
}

export function paginated(list: any[], total: number, page: number, pageSize: number) {
  return success({ list, total, page, pageSize })
}
