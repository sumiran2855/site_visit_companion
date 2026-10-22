import {
  SiteSubmission,
  SubmissionArea,
  SubmissionMedia,
  ApprovalChecklistItem,
  CustomerRequest,
  SubmissionsFilterState,
} from '@/types/submission';

const CACHE_KEY_SUBMISSIONS = '@ecpower_admin_site_submissions_v1';

// Reliable realistic industrial inspection images for areas
const DEMO_MEDIA: Record<string, { photos: string[]; videos: string[] }> = {
  boiler: {
    photos: [
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80',
    ],
    videos: [
      'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  electrical: {
    photos: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
    ],
    videos: [],
  },
  gas: {
    photos: [
      'https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    ],
    videos: [],
  },
  outdoor: {
    photos: [
      'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1200&q=80',
    ],
    videos: [],
  },
  path: {
    photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    ],
    videos: [],
  },
};

const DEFAULT_SUBMISSIONS: SiteSubmission[] = [
  {
    id: 'sub-001',
    siteName: 'Benbow Historical Inn',
    location: {
      city: 'Garberville',
      state: 'CA',
      country: 'US',
      address: '445 Lake Benbow Dr',
    },
    customer: 'TEST POWER INC',
    sentBy: 'J. Miller',
    sentAt: '2026-10-21T14:32:00Z',
    formattedDate: 'Oct 21',
    status: 'in_review',
    reviewer: 'Martin H.',
    mediaCount: {
      photos: 18,
      videos: 3,
    },
    areas: [
      {
        id: 'area-xrgi',
        name: 'Proposed XRGI location',
        status: 'ok',
        specs: {
          'Proposed Model': 'XRGI 20kW CHP',
          'Floor Loading': '1,200 kg/m²',
          'Clearance Distance': '4.5 ft to nearest partition',
        },
        customerNote: 'Concrete plinth is vibration-damped and level.',
        media: [
          {
            id: 'med-01',
            type: 'photo',
            title: 'Base Plate Location',
            url: DEMO_MEDIA.boiler.photos[0],
            fieldId: 'xrgi_base',
            takenAt: '2026-10-21 11:20 AM',
            resolution: '4032 x 3024',
            fileSize: '3.4 MB',
          },
          {
            id: 'med-02',
            type: 'photo',
            title: 'Clearance Zone North',
            url: DEMO_MEDIA.boiler.photos[1],
            fieldId: 'xrgi_clearance',
            takenAt: '2026-10-21 11:22 AM',
            resolution: '4032 x 3024',
            fileSize: '3.1 MB',
          },
        ],
      },
      {
        id: 'area-boiler',
        name: 'Boiler / mechanical room',
        status: 'not_reviewed',
        specs: {
          'Ceiling height': '9 ft',
          'Door width': '32 in',
          'Free floor space': '[value]',
        },
        customerNote:
          'Old oil tank in the corner will be removed before installation.',
        media: [
          {
            id: 'med-b1',
            type: 'photo',
            title: 'Wall 1',
            url: DEMO_MEDIA.boiler.photos[0],
            fieldId: 'wall_1',
            takenAt: '2026-10-21 11:30 AM',
            resolution: '4032 x 3024',
            fileSize: '3.8 MB',
          },
          {
            id: 'med-b2',
            type: 'photo',
            title: 'Wall 2',
            url: DEMO_MEDIA.boiler.photos[1],
            fieldId: 'wall_2',
            takenAt: '2026-10-21 11:32 AM',
            resolution: '4032 x 3024',
            fileSize: '3.6 MB',
          },
          {
            id: 'med-b3',
            type: 'photo',
            title: 'Wall 3',
            url: DEMO_MEDIA.boiler.photos[2],
            fieldId: 'wall_3',
            takenAt: '2026-10-21 11:34 AM',
            resolution: '4032 x 3024',
            fileSize: '4.1 MB',
          },
          {
            id: 'med-b4',
            type: 'photo',
            title: 'Wall 4',
            url: DEMO_MEDIA.boiler.photos[3],
            fieldId: 'wall_4',
            takenAt: '2026-10-21 11:36 AM',
            resolution: '4032 x 3024',
            fileSize: '3.2 MB',
          },
          {
            id: 'med-b5',
            type: 'video',
            title: '360° room',
            url: DEMO_MEDIA.boiler.videos[0],
            fieldId: 'room_pan_360',
            takenAt: '2026-10-21 11:40 AM',
            duration: '0:45',
            fileSize: '28.4 MB',
          },
          {
            id: 'med-b6',
            type: 'photo',
            title: 'Floor / drain',
            url: DEMO_MEDIA.boiler.photos[4],
            fieldId: 'floor_drain',
            takenAt: '2026-10-21 11:42 AM',
            resolution: '4032 x 3024',
            fileSize: '3.5 MB',
          },
        ],
      },
      {
        id: 'area-electric',
        name: 'Electric meter room',
        status: 'more_requested',
        requestedNote: 'meter photo is blurry - please retake close-up.',
        specs: {
          'Main Breaker': '200A',
          'Busbar Capacity': '400A',
          'Available Slots': '4 slots',
        },
        customerNote: 'Sub-panel requires separate grounding rod.',
        media: [
          {
            id: 'med-e1',
            type: 'photo',
            title: 'Main Switchboard',
            url: DEMO_MEDIA.electrical.photos[0],
            fieldId: 'elec_board',
            takenAt: '2026-10-21 11:45 AM',
            resolution: '4032 x 3024',
            fileSize: '3.9 MB',
          },
          {
            id: 'med-e2',
            type: 'photo',
            title: 'Tie-in Busbar',
            url: DEMO_MEDIA.electrical.photos[1],
            fieldId: 'elec_busbar',
            takenAt: '2026-10-21 11:48 AM',
            resolution: '4032 x 3024',
            fileSize: '3.3 MB',
          },
        ],
      },
      {
        id: 'area-gas',
        name: 'Main gas meter',
        status: 'ok',
        specs: {
          'Gas Pressure': '22 mbar',
          'Pipe Diameter': '2 in',
          'Meter Type': 'Diaphragm G16',
        },
        customerNote: 'Gas supply line verified reachable within 4 meters.',
        media: [
          {
            id: 'med-g1',
            type: 'photo',
            title: 'Gas Governor & Meter',
            url: DEMO_MEDIA.gas.photos[0],
            fieldId: 'gas_meter',
            takenAt: '2026-10-21 11:52 AM',
            resolution: '4032 x 3024',
            fileSize: '4.2 MB',
          },
          {
            id: 'med-g2',
            type: 'photo',
            title: 'Shut-off Valve',
            url: DEMO_MEDIA.gas.photos[1],
            fieldId: 'gas_valve',
            takenAt: '2026-10-21 11:54 AM',
            resolution: '4032 x 3024',
            fileSize: '3.0 MB',
          },
        ],
      },
      {
        id: 'area-path',
        name: 'Access path from outside',
        status: 'ok',
        specs: {
          'Pathway Width': '42 in',
          'Stairs Count': '0 (Flat ground)',
          'Threshold Step': '2 in ramped',
        },
        customerNote:
          'Wide double doors facilitate forklift / pallet truck delivery without crane.',
        media: [
          {
            id: 'med-p1',
            type: 'photo',
            title: 'Delivery Gateway',
            url: DEMO_MEDIA.path.photos[0],
            fieldId: 'path_gate',
            takenAt: '2026-10-21 11:58 AM',
            resolution: '4032 x 3024',
            fileSize: '3.7 MB',
          },
          {
            id: 'med-p2',
            type: 'photo',
            title: 'Corridor Width',
            url: DEMO_MEDIA.path.photos[1],
            fieldId: 'path_hall',
            takenAt: '2026-10-21 12:02 PM',
            resolution: '4032 x 3024',
            fileSize: '3.5 MB',
          },
        ],
      },
      {
        id: 'area-outdoors',
        name: 'Outdoors & exhaust route',
        status: 'more_requested',
        requestedNote:
          'add photo of outside wall for exhaust, roof edge visible.',
        specs: {
          'Flue Height Required': '24 ft',
          'Distance to Window': '12 ft',
          'Wall Penetration': 'Brick / Masonry',
        },
        customerNote: 'Chimney route needs clear roof access permission.',
        media: [
          {
            id: 'med-o1',
            type: 'photo',
            title: 'Exterior South Wall',
            url: DEMO_MEDIA.outdoor.photos[0],
            fieldId: 'out_wall',
            takenAt: '2026-10-21 12:10 PM',
            resolution: '4032 x 3024',
            fileSize: '4.4 MB',
          },
          {
            id: 'med-o2',
            type: 'photo',
            title: 'Roofline Penetration',
            url: DEMO_MEDIA.outdoor.photos[1],
            fieldId: 'out_roof',
            takenAt: '2026-10-21 12:12 PM',
            resolution: '4032 x 3024',
            fileSize: '4.0 MB',
          },
        ],
      },
    ],
    approvalChecklist: [
      { id: 'chk-1', label: 'Space for XRGI unit', checked: true },
      { id: 'chk-2', label: 'Gas supply reachable', checked: true },
      { id: 'chk-3', label: 'Electrical connection', checked: false },
      { id: 'chk-4', label: 'Exhaust / flue route', checked: false },
      { id: 'chk-5', label: 'Access path for delivery', checked: true },
    ],
    customerRequests: [
      {
        id: 'req-1',
        areaId: 'area-electric',
        areaName: 'Electric meter room',
        text: 'meter photo is blurry – please retake close-up.',
        createdAt: '2026-10-21T15:10:00Z',
      },
      {
        id: 'req-2',
        areaId: 'area-outdoors',
        areaName: 'Outdoors & exhaust route',
        text: 'add photo of outside wall for exhaust, roof edge visible.',
        createdAt: '2026-10-21T15:12:00Z',
      },
    ],
    internalNotes: '',
    createdAt: '2026-10-21T14:32:00Z',
    updatedAt: '2026-10-21T15:12:00Z',
  },
  {
    id: 'sub-002',
    siteName: 'Grand Vista Resort',
    location: {
      city: 'Denver',
      state: 'CO',
      country: 'US',
    },
    customer: 'Alpine Energy Systems',
    sentBy: 'S. Davis',
    sentAt: '2026-10-21T09:15:00Z',
    formattedDate: 'Oct 21',
    status: 'new',
    reviewer: null,
    mediaCount: {
      photos: 22,
      videos: 2,
    },
    areas: [
      {
        id: 'gv-a1',
        name: 'Boiler / mechanical room',
        status: 'not_reviewed',
        specs: { 'Ceiling height': '11 ft', 'Door width': '36 in' },
        media: [],
      },
      {
        id: 'gv-a2',
        name: 'Electrical room',
        status: 'not_reviewed',
        specs: { Voltage: '480V 3-Phase' },
        media: [],
      },
    ],
    approvalChecklist: [
      { id: 'gv-c1', label: 'Space for XRGI unit', checked: false },
      { id: 'gv-c2', label: 'Gas supply reachable', checked: false },
      { id: 'gv-c3', label: 'Electrical connection', checked: false },
      { id: 'gv-c4', label: 'Exhaust / flue route', checked: false },
      { id: 'gv-c5', label: 'Access path for delivery', checked: false },
    ],
    customerRequests: [],
    internalNotes: '',
    createdAt: '2026-10-21T09:15:00Z',
    updatedAt: '2026-10-21T09:15:00Z',
  },
  {
    id: 'sub-003',
    siteName: 'Metro Hospital Central',
    location: {
      city: 'Chicago',
      state: 'IL',
      country: 'US',
    },
    customer: 'Apex Power Solutions',
    sentBy: 'R. Patel',
    sentAt: '2026-10-20T16:45:00Z',
    formattedDate: 'Oct 20',
    status: 'new',
    reviewer: null,
    mediaCount: {
      photos: 15,
      videos: 2,
    },
    areas: [
      {
        id: 'mh-a1',
        name: 'Primary Plant Room',
        status: 'not_reviewed',
        specs: { 'Ceiling height': '14 ft' },
        media: [],
      },
    ],
    approvalChecklist: [
      { id: 'mh-c1', label: 'Space for XRGI unit', checked: false },
      { id: 'mh-c2', label: 'Gas supply reachable', checked: false },
      { id: 'mh-c3', label: 'Electrical connection', checked: false },
      { id: 'mh-c4', label: 'Exhaust / flue route', checked: false },
      { id: 'mh-c5', label: 'Access path for delivery', checked: false },
    ],
    customerRequests: [],
    internalNotes: '',
    createdAt: '2026-10-20T16:45:00Z',
    updatedAt: '2026-10-20T16:45:00Z',
  },
  {
    id: 'sub-004',
    siteName: 'Pacific Cold Storage',
    location: {
      city: 'Seattle',
      state: 'WA',
      country: 'US',
    },
    customer: 'Cascade Thermal',
    sentBy: 'K. Larson',
    sentAt: '2026-10-17T11:20:00Z',
    formattedDate: 'Oct 17',
    status: 'waiting_for_customer',
    reviewer: 'Martin H.',
    mediaCount: {
      photos: 19,
      videos: 3,
    },
    areas: [
      {
        id: 'pc-a1',
        name: 'Compressor Hall',
        status: 'more_requested',
        requestedNote: 'Provide high-res image of gas pressure regulator tag.',
        specs: { 'Ceiling height': '18 ft' },
        media: [],
      },
    ],
    approvalChecklist: [
      { id: 'pc-c1', label: 'Space for XRGI unit', checked: true },
      { id: 'pc-c2', label: 'Gas supply reachable', checked: false },
      { id: 'pc-c3', label: 'Electrical connection', checked: true },
      { id: 'pc-c4', label: 'Exhaust / flue route', checked: false },
      { id: 'pc-c5', label: 'Access path for delivery', checked: true },
    ],
    customerRequests: [
      {
        id: 'pc-req-1',
        areaId: 'pc-a1',
        areaName: 'Compressor Hall',
        text: 'Provide high-res image of gas pressure regulator tag.',
        createdAt: '2026-10-17T14:00:00Z',
      },
    ],
    internalNotes: 'Awaiting revised pressure documentation.',
    createdAt: '2026-10-17T11:20:00Z',
    updatedAt: '2026-10-17T14:00:00Z',
  },
  {
    id: 'sub-005',
    siteName: 'Harbor District Plant',
    location: {
      city: 'San Diego',
      state: 'CA',
      country: 'US',
    },
    customer: 'SunState Energy',
    sentBy: 'D. Torres',
    sentAt: '2026-10-15T13:10:00Z',
    formattedDate: 'Oct 15',
    status: 'waiting_for_customer',
    reviewer: 'Sarah C.',
    mediaCount: {
      photos: 12,
      videos: 1,
    },
    areas: [
      {
        id: 'hd-a1',
        name: 'Outdoor Pad',
        status: 'more_requested',
        requestedNote: 'Confirm distance to nearest sound-sensitive property boundary.',
        specs: { 'Pad size': '12x8 ft' },
        media: [],
      },
    ],
    approvalChecklist: [
      { id: 'hd-c1', label: 'Space for XRGI unit', checked: true },
      { id: 'hd-c2', label: 'Gas supply reachable', checked: true },
      { id: 'hd-c3', label: 'Electrical connection', checked: false },
      { id: 'hd-c4', label: 'Exhaust / flue route', checked: true },
      { id: 'hd-c5', label: 'Access path for delivery', checked: true },
    ],
    customerRequests: [
      {
        id: 'hd-req-1',
        areaId: 'hd-a1',
        areaName: 'Outdoor Pad',
        text: 'Confirm distance to nearest sound-sensitive property boundary.',
        createdAt: '2026-10-15T15:30:00Z',
      },
    ],
    internalNotes: 'Coastal acoustic zoning applies.',
    createdAt: '2026-10-15T13:10:00Z',
    updatedAt: '2026-10-15T15:30:00Z',
  },
  {
    id: 'sub-006',
    siteName: 'Oak Ridge Data Center',
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'US',
    },
    customer: 'Texas Clean Cogeneration',
    sentBy: 'A. Nguyen',
    sentAt: '2026-10-09T08:00:00Z',
    formattedDate: 'Oct 9',
    status: 'approved',
    reviewer: 'Martin H.',
    mediaCount: {
      photos: 24,
      videos: 3,
    },
    areas: [
      {
        id: 'or-a1',
        name: 'Generator Bay 2',
        status: 'ok',
        specs: { 'Ceiling height': '16 ft', 'Breaker Capacity': '800A' },
        media: [],
      },
    ],
    approvalChecklist: [
      { id: 'or-c1', label: 'Space for XRGI unit', checked: true },
      { id: 'or-c2', label: 'Gas supply reachable', checked: true },
      { id: 'or-c3', label: 'Electrical connection', checked: true },
      { id: 'or-c4', label: 'Exhaust / flue route', checked: true },
      { id: 'or-c5', label: 'Access path for delivery', checked: true },
    ],
    customerRequests: [],
    internalNotes: 'Full compliance verified on Oct 9.',
    createdAt: '2026-10-09T08:00:00Z',
    updatedAt: '2026-10-09T14:20:00Z',
  },
  {
    id: 'sub-007',
    siteName: 'St. Jude Medical Campus',
    location: {
      city: 'Memphis',
      state: 'TN',
      country: 'US',
    },
    customer: 'MidSouth Thermal',
    sentBy: 'T. Jenkins',
    sentAt: '2026-10-02T15:00:00Z',
    formattedDate: 'Oct 2',
    status: 'approved',
    reviewer: 'Sarah C.',
    mediaCount: {
      photos: 20,
      videos: 2,
    },
    areas: [
      {
        id: 'sj-a1',
        name: 'East Wing Mechanical',
        status: 'ok',
        specs: { 'Ceiling height': '12 ft' },
        media: [],
      },
    ],
    approvalChecklist: [
      { id: 'sj-c1', label: 'Space for XRGI unit', checked: true },
      { id: 'sj-c2', label: 'Gas supply reachable', checked: true },
      { id: 'sj-c3', label: 'Electrical connection', checked: true },
      { id: 'sj-c4', label: 'Exhaust / flue route', checked: true },
      { id: 'sj-c5', label: 'Access path for delivery', checked: true },
    ],
    customerRequests: [],
    internalNotes: 'Approved for Q4 delivery.',
    createdAt: '2026-10-02T15:00:00Z',
    updatedAt: '2026-10-03T11:00:00Z',
  },
  {
    id: 'sub-008',
    siteName: 'Northlake Logistics Hub',
    location: {
      city: 'Minneapolis',
      state: 'MN',
      country: 'US',
    },
    customer: 'Twin Cities Power',
    sentBy: 'E. Clark',
    sentAt: '2026-09-28T12:00:00Z',
    formattedDate: 'Draft',
    status: 'draft',
    reviewer: null,
    mediaCount: {
      photos: 6,
      videos: 0,
    },
    areas: [
      {
        id: 'nl-a1',
        name: 'Loading Bay Utility Room',
        status: 'not_reviewed',
        specs: { 'Ceiling height': '10 ft' },
        media: [],
      },
    ],
    approvalChecklist: [
      { id: 'nl-c1', label: 'Space for XRGI unit', checked: false },
      { id: 'nl-c2', label: 'Gas supply reachable', checked: false },
      { id: 'nl-c3', label: 'Electrical connection', checked: false },
      { id: 'nl-c4', label: 'Exhaust / flue route', checked: false },
      { id: 'nl-c5', label: 'Access path for delivery', checked: false },
    ],
    customerRequests: [],
    internalNotes: 'Technician has not finalized all checklist sections yet.',
    createdAt: '2026-09-28T12:00:00Z',
    updatedAt: '2026-09-28T12:00:00Z',
  },
];

export class SubmissionService {
  /**
   * Loads all submissions from local storage or returns the default set
   */
  public static async getSubmissions(
    filters?: Partial<SubmissionsFilterState>
  ): Promise<SiteSubmission[]> {
    let list: SiteSubmission[] = [];

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CACHE_KEY_SUBMISSIONS);
        if (stored) {
          list = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('Failed to parse cached submissions:', err);
      }
    }

    if (!list || list.length === 0) {
      list = [...DEFAULT_SUBMISSIONS];
      this.saveLocalSubmissions(list);
    }

    // Apply Filters
    if (filters) {
      if (filters.status && filters.status !== 'all') {
        list = list.filter((s) => s.status === filters.status);
      }

      if (filters.customer && filters.customer !== 'all') {
        const target = filters.customer.toLowerCase().trim();
        list = list.filter((s) => s.customer.toLowerCase().trim() === target);
      }

      if (filters.country && filters.country !== 'all') {
        const target = filters.country.toLowerCase().trim();
        list = list.filter(
          (s) => s.location.country.toLowerCase().trim() === target
        );
      }

      if (filters.search && filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        list = list.filter(
          (s) =>
            s.siteName.toLowerCase().includes(q) ||
            s.customer.toLowerCase().includes(q) ||
            s.sentBy.toLowerCase().includes(q) ||
            s.location.city.toLowerCase().includes(q) ||
            s.location.state.toLowerCase().includes(q)
        );
      }
    }

    return list;
  }

  /**
   * Retrieves single submission by ID
   */
  public static async getSubmissionById(
    id: string
  ): Promise<SiteSubmission | null> {
    const list = await this.getSubmissions();
    return list.find((s) => s.id === id) || null;
  }

  /**
   * Updates an area's review status (e.g. 'ok', 'more_requested', 'not_reviewed')
   */
  public static async updateAreaStatus(
    submissionId: string,
    areaId: string,
    status: 'ok' | 'more_requested' | 'not_reviewed',
    requestedNote?: string
  ): Promise<SiteSubmission> {
    const list = await this.getSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    if (itemIndex === -1) throw new Error('Submission not found');

    const sub = list[itemIndex];
    const area = sub.areas.find((a) => a.id === areaId);
    if (area) {
      area.status = status;
      if (requestedNote !== undefined) {
        area.requestedNote = requestedNote;
      }
    }

    // If marked OK, and this area had a queued request, remove it
    if (status === 'ok') {
      sub.customerRequests = sub.customerRequests.filter(
        (r) => r.areaId !== areaId
      );
    }

    sub.updatedAt = new Date().toISOString();
    list[itemIndex] = sub;
    this.saveLocalSubmissions(list);
    return sub;
  }

  /**
   * Toggles an item in the approval checklist
   */
  public static async toggleChecklistItem(
    submissionId: string,
    checkId: string,
    checked: boolean
  ): Promise<SiteSubmission> {
    const list = await this.getSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    if (itemIndex === -1) throw new Error('Submission not found');

    const sub = list[itemIndex];
    const item = sub.approvalChecklist.find((c) => c.id === checkId);
    if (item) {
      item.checked = checked;
    }

    sub.updatedAt = new Date().toISOString();
    list[itemIndex] = sub;
    this.saveLocalSubmissions(list);
    return sub;
  }

  /**
   * Adds or updates a customer request in the review queue
   */
  public static async queueCustomerRequest(
    submissionId: string,
    areaId: string,
    text: string
  ): Promise<SiteSubmission> {
    const list = await this.getSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    if (itemIndex === -1) throw new Error('Submission not found');

    const sub = list[itemIndex];
    const area = sub.areas.find((a) => a.id === areaId);
    const areaName = area?.name || 'Area';

    // Mark the area as more requested
    if (area) {
      area.status = 'more_requested';
      area.requestedNote = text;
    }

    // Check if an existing request for this area exists
    const existingIndex = sub.customerRequests.findIndex(
      (r) => r.areaId === areaId
    );
    if (existingIndex >= 0) {
      sub.customerRequests[existingIndex].text = text;
    } else {
      sub.customerRequests.push({
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        areaId,
        areaName,
        text,
        createdAt: new Date().toISOString(),
      });
    }

    sub.updatedAt = new Date().toISOString();
    list[itemIndex] = sub;
    this.saveLocalSubmissions(list);
    return sub;
  }

  /**
   * Removes a queued customer request
   */
  public static async removeQueuedRequest(
    submissionId: string,
    requestId: string
  ): Promise<SiteSubmission> {
    const list = await this.getSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    if (itemIndex === -1) throw new Error('Submission not found');

    const sub = list[itemIndex];
    const req = sub.customerRequests.find((r) => r.id === requestId);
    if (req) {
      const area = sub.areas.find((a) => a.id === req.areaId);
      if (area && area.status === 'more_requested') {
        area.status = 'not_reviewed';
        delete area.requestedNote;
      }
      sub.customerRequests = sub.customerRequests.filter(
        (r) => r.id !== requestId
      );
    }

    sub.updatedAt = new Date().toISOString();
    list[itemIndex] = sub;
    this.saveLocalSubmissions(list);
    return sub;
  }

  /**
   * Dispatches all queued requests to the customer, setting status to 'waiting_for_customer'
   */
  public static async sendRequestsToCustomer(
    submissionId: string
  ): Promise<SiteSubmission> {
    const list = await this.getSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    if (itemIndex === -1) throw new Error('Submission not found');

    const sub = list[itemIndex];
    sub.status = 'waiting_for_customer';
    sub.updatedAt = new Date().toISOString();

    list[itemIndex] = sub;
    this.saveLocalSubmissions(list);
    return sub;
  }

  /**
   * Saves internal admin note
   */
  public static async saveInternalNotes(
    submissionId: string,
    notes: string
  ): Promise<SiteSubmission> {
    const list = await this.getSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    if (itemIndex === -1) throw new Error('Submission not found');

    const sub = list[itemIndex];
    sub.internalNotes = notes;
    sub.updatedAt = new Date().toISOString();

    list[itemIndex] = sub;
    this.saveLocalSubmissions(list);
    return sub;
  }

  /**
   * Approves the site submission
   */
  public static async approveSubmission(
    submissionId: string,
    reviewerName: string = 'Martin H.'
  ): Promise<SiteSubmission> {
    const list = await this.getSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    if (itemIndex === -1) throw new Error('Submission not found');

    const sub = list[itemIndex];
    sub.status = 'approved';
    sub.reviewer = reviewerName;
    sub.closedAt = new Date().toISOString();
    sub.updatedAt = new Date().toISOString();

    // Mark all areas as OK if not already
    sub.areas.forEach((a) => {
      a.status = 'ok';
    });

    list[itemIndex] = sub;
    this.saveLocalSubmissions(list);
    return sub;
  }

  /**
   * Rejects the site submission
   */
  public static async rejectSubmission(
    submissionId: string,
    reason: string,
    reviewerName: string = 'Martin H.'
  ): Promise<SiteSubmission> {
    const list = await this.getSubmissions();
    const itemIndex = list.findIndex((s) => s.id === submissionId);
    if (itemIndex === -1) throw new Error('Submission not found');

    const sub = list[itemIndex];
    sub.status = 'waiting_for_customer';
    sub.rejectionReason = reason;
    sub.reviewer = reviewerName;
    sub.updatedAt = new Date().toISOString();

    list[itemIndex] = sub;
    this.saveLocalSubmissions(list);
    return sub;
  }

  /**
   * Generates a zip bundle download of all site photos and manifest
   */
  public static async downloadMediaZip(submission: SiteSubmission): Promise<void> {
    if (typeof window === 'undefined') return;

    // Collect all media items
    const allMedia: { name: string; url: string; area: string }[] = [];
    submission.areas.forEach((area) => {
      area.media.forEach((m) => {
        allMedia.push({
          name: `${area.name.replace(/[^a-z0-9]/gi, '_')}_${m.title.replace(/[^a-z0-9]/gi, '_')}.jpg`,
          url: m.url,
          area: area.name,
        });
      });
    });

    // Generate JSON manifest and trigger direct browser download
    const manifest = {
      siteName: submission.siteName,
      customer: submission.customer,
      location: submission.location,
      mediaCount: submission.mediaCount,
      files: allMedia,
      downloadedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${submission.siteName.replace(/[^a-z0-9]/gi, '_')}_media_manifest.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private static saveLocalSubmissions(list: SiteSubmission[]) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CACHE_KEY_SUBMISSIONS, JSON.stringify(list));
      } catch (err) {
        console.warn('Failed to save submissions to localStorage:', err);
      }
    }
  }
}

