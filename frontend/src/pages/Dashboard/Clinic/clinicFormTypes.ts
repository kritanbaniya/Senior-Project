// shared clinic admin form shape (create + edit + geocode helpers)

export type ClinicFormData = {
  clinic_name: string
  specialty: string
  phone: string
  email: string
  google_place_id: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  zip_code: string
  website: string
  description: string
}
