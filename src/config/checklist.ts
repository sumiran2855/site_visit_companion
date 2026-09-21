export interface ChecklistFieldConfig {
  id: string;
  label: string;
  type: "text" | "photo" | "video";
  placeholder?: string;
  description?: string;
  required?: boolean;
  instructions?: string;
}

export interface ChecklistSectionConfig {
  id: string;
  number: number;
  title: string;
  instructions?: string;
  fields: ChecklistFieldConfig[];
}

export const CHECKLIST_SECTIONS_CONFIG: ChecklistSectionConfig[] = [
  {
    id: "sec-meeting",
    number: 1,
    title: "Meeting Context",
    instructions: "Record basic client meeting attendee information and project stakeholders.",
    fields: [
      {
        id: "mc_contact_person",
        label: "Contact Person / Site Host",
        type: "text",
        placeholder: "e.g. John Miller, Facilities Director",
        required: true,
      },
      {
        id: "mc_phone_number",
        label: "Phone / Contact Number",
        type: "text",
        placeholder: "+1 (555) 019-2834",
        required: true,
      },
      {
        id: "mc_building_type",
        label: "Building Type & Use",
        type: "text",
        placeholder: "e.g. Hotel, Hospital, Multi-family Residential",
      },
      {
        id: "mc_meeting_notes",
        label: "General Meeting & Survey Notes",
        type: "text",
        placeholder: "Key conversation points, access constraints...",
      },
    ],
  },
  {
    id: "sec-consumption",
    number: 2,
    title: "Consumption Data",
    instructions: "Collect historical energy utility data to size the XRGI installation properly.",
    fields: [
      {
        id: "cd_annual_electricity",
        label: "Annual Electricity Consumption (kWh)",
        type: "text",
        placeholder: "e.g. 450,000 kWh",
      },
      {
        id: "cd_annual_gas",
        label: "Annual Natural Gas Consumption (therms / m³)",
        type: "text",
        placeholder: "e.g. 32,000 therms",
      },
      {
        id: "cd_peak_electrical_demand",
        label: "Peak Electrical Demand (kW)",
        type: "text",
        placeholder: "e.g. 185 kW",
      },
      {
        id: "cd_utility_bills_photo",
        label: "Utility Bills / Meter Statements",
        type: "photo",
        description: "Capture photo of recent utility statements or tariff schedules.",
      },
    ],
  },
  {
    id: "sec-efficiency",
    number: 3,
    title: "Planned Efficiency Upgrades",
    instructions: "Document upcoming site renovations, insulation, or heat pump plans.",
    fields: [
      {
        id: "pe_planned_changes",
        label: "Planned HVAC / Energy Upgrades",
        type: "text",
        placeholder: "e.g. Upgrading 3 air handling units in Q3...",
      },
      {
        id: "pe_timeline",
        label: "Estimated Implementation Timeline",
        type: "text",
        placeholder: "e.g. 6 - 12 months",
      },
      {
        id: "pe_upgrade_docs_photo",
        label: "Renovation Plans / Engineering Schematics",
        type: "photo",
      },
    ],
  },
  {
    id: "sec-existing-xrgi",
    number: 4,
    title: "Existing XRGI",
    instructions: "For sites with previous or adjacent CHP systems installed.",
    fields: [
      {
        id: "xrgi_has_unit",
        label: "Existing XRGI Unit Present?",
        type: "text",
        placeholder: "Yes / No (specify model e.g. XRGI 9, 15, or 20)",
      },
      {
        id: "xrgi_serial_number",
        label: "Serial Number & Commissioning Date",
        type: "text",
        placeholder: "e.g. SN-884920 / Installed May 2021",
      },
      {
        id: "xrgi_nameplate_photo",
        label: "XRGI Nameplate Photo",
        type: "photo",
      },
    ],
  },
  {
    id: "sec-boiler-room",
    number: 5,
    title: "Boiler & Mechanical Room",
    instructions:
      "Document clockwise while standing in the room facing the door. Wall 1 = wall with service entry door.",
    fields: [
      {
        id: "bm_wall1_photos",
        label: "Wall 1 (Service Entry Door Wall) Photos",
        type: "photo",
        required: true,
        instructions: "Stand inside facing the main entry door.",
      },
      {
        id: "bm_wall2_photos",
        label: "Wall 2 (Left of Door) Photos",
        type: "photo",
        required: true,
      },
      {
        id: "bm_wall3_photos",
        label: "Wall 3 (Opposite Door) Photos",
        type: "photo",
        required: true,
      },
      {
        id: "bm_wall4_photos",
        label: "Wall 4 (Right of Door) Photos",
        type: "photo",
        required: true,
      },
      {
        id: "bm_room_360_video",
        label: "360° Video of Mechanical Room",
        type: "video",
        instructions: "Stand in center of the room and pan 360 degrees steadily.",
      },
      {
        id: "bm_ceiling_height",
        label: "Ceiling Clearance & Piping Clearance (ft / m)",
        type: "text",
        placeholder: "e.g. 10.5 ft (3.2 m) clearance",
      },
      {
        id: "bm_existing_boilers",
        label: "Existing Boiler Manufacturer, Capacity & Fuel",
        type: "text",
        placeholder: "e.g. 2x Viessmann 500k BTU, Natural Gas",
      },
      {
        id: "bm_exhaust_route_photo",
        label: "Exhaust & Flue Routing Photos",
        type: "photo",
      },
    ],
  },
  {
    id: "sec-electric-room",
    number: 6,
    title: "Electric Meter Room",
    instructions: "Inspect the main distribution panel and connection path.",
    fields: [
      {
        id: "em_main_panel_photos",
        label: "Main Electrical Distribution Panel Photos",
        type: "photo",
        required: true,
      },
      {
        id: "em_voltage_service",
        label: "Voltage & Service Capacity",
        type: "text",
        placeholder: "e.g. 480V 3-Phase, 800A Main Breaker",
      },
      {
        id: "em_interconnection_distance",
        label: "Estimated Distance to Boiler Room (ft / m)",
        type: "text",
        placeholder: "e.g. 45 ft via basement corridor",
      },
    ],
  },
  {
    id: "sec-gas-meter",
    number: 7,
    title: "Main Gas Meter Location",
    instructions: "Verify gas supply line sizing and gas pressure.",
    fields: [
      {
        id: "gm_meter_photos",
        label: "Gas Meter & Supply Regulator Photos",
        type: "photo",
        required: true,
      },
      {
        id: "gm_pipe_size",
        label: "Gas Pipe Diameter & Operating Pressure",
        type: "text",
        placeholder: "e.g. 2-inch pipe, 7 in. w.c. or 2 PSI",
      },
    ],
  },
  {
    id: "sec-outdoors",
    number: 8,
    title: "Outdoors & Delivery Access",
    instructions: "Evaluate delivery path, doorways, and outdoor sound considerations.",
    fields: [
      {
        id: "od_delivery_path_photo",
        label: "Delivery Path & Access Door Clearance",
        type: "photo",
        description: "Minimum 36 in (90 cm) door width required.",
      },
      {
        id: "od_crane_loading_notes",
        label: "Rigging / Elevator / Ramp Notes",
        type: "text",
        placeholder: "e.g. Freight elevator available (max 2,000 lbs)",
      },
    ],
  },
  {
    id: "sec-marketing",
    number: 9,
    title: "Marketing & Social Media",
    instructions: "Optional customer promotional and showcase photo documentation.",
    fields: [
      {
        id: "mkt_building_exterior_photo",
        label: "Building Exterior Showcase Photo",
        type: "photo",
      },
      {
        id: "mkt_permission_notes",
        label: "Customer Case Study / Logo Usage Consent",
        type: "text",
        placeholder: "e.g. Customer agreed to case study feature",
      },
    ],
  },
];

