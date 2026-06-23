export type Log = {
  id: string
  ticket_id: string
  route_name: string | null
  vehicle_no: string | null
  driver_name: string | null
  gt: string | null
  gt_id: string | null
  gt2: string | null
  gt2_id: string | null
  vehicle_serial: number | null
  contact_name: string | null
  location: string | null
  sub_category: string | null
  dt_status?: string | null
  notes: string | null
  gt_status?: string | null
  remarks?: string | null
  gt_maps_link?: string | null
}

export type Vehicle = {
  id: string
  vehicle_no: string
  default_driver: string | null
}

export type GTMember = {
  id: string
  name: string
}

export type RouteGroup = {
  route_name: string
  logs: Log[]
  vehicle_no: string
  driver_name: string
  gt: string
  gt_id: string | null
  gt2: string | null
  gt2_id: string | null
  vehicle_serial: number | null
}

export type GTStatusOption = {
  name: string
  color: string
}

export type DTStatusOption = {
  name: string
  color: string
}

export type SubCategoryOption = {
  name: string
  icon: string
  color: string
}
