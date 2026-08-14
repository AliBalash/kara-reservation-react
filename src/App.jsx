import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import {
  API_BASE,
  createReservation,
  fetchBootstrap,
  fetchCars,
  fetchQuote,
  isValidationApiError,
} from "./api";
import "./App.css";
import "react-datepicker/dist/react-datepicker.css";
import KaraFooter from "./components/KaraFooter";
import KaraHeader from "./components/KaraHeader";
import ReservationHero from "./components/ReservationHero";
import SuccessState from "./components/SuccessState";

const MENU_ITEMS = [
  { label: "Home", href: "https://newsite.karaplus.ae/" },
  { label: "All Cars", href: "https://newsite.karaplus.ae/cars/" },
  { label: "Blog", href: "https://newsite.karaplus.ae/blog/" },
  { label: "About Us", href: "https://newsite.karaplus.ae/about-us/" },
  { label: "Contact", href: "https://newsite.karaplus.ae/contact/" },
];

const PRICE_MENU_ITEMS = [
  { label: "Economy Cars", href: "https://newsite.karaplus.ae/product-category/economy-cars/" },
  { label: "Premium Cars", href: "https://newsite.karaplus.ae/product-category/premium-cars/" },
  { label: "Luxury Cars", href: "https://newsite.karaplus.ae/product-category/luxury-cars/" },
];

const INFO_LINKS = [
  { label: "About Us", href: "https://newsite.karaplus.ae/about-us/" },
  { label: "FAQs", href: "https://newsite.karaplus.ae/faqs/" },
  { label: "Terms & Conditions", href: "https://newsite.karaplus.ae/terms-conditions/" },
  { label: "Contact", href: "https://newsite.karaplus.ae/contact/" },
];

const STEPS = [
  {
    id: 0,
    title: "Plan Your Rental",
    subtitle: "Dates, times and locations",
  },
  {
    id: 1,
    title: "Choose Your Car",
    subtitle: "Find the right vehicle",
  },
  {
    id: 2,
    title: "Your Details",
    subtitle: "Complete your request",
  },
];

const PHONE_REGEX = /^\+\d{8,15}$/;
const LOCAL_CAR_PLACEHOLDER = "/car-placeholder.svg";

const BRAND_LOGO_PATHS = {
  bentley: "/brand-logos/bentley.svg",
  benz: "/brand-logos/benz.svg",
  bmw: "/brand-logos/bmw.svg",
  cadillac: "/brand-logos/cadillac.svg",
  chevrolet: "/brand-logos/chevrolet.svg",
  citroen: "/brand-logos/citroen.svg",
  ford: "/brand-logos/ford.svg",
  hyundai: "/brand-logos/hyundai.svg",
  jetour: "/brand-logos/jetour.svg",
  kia: "/brand-logos/kia.svg",
  lamborghini: "/brand-logos/lamborghini.svg",
  landrover: "/brand-logos/landrover.svg",
  mazda: "/brand-logos/mazda.svg",
  mitsubishi: "/brand-logos/mitsubishi.svg",
  nissan: "/brand-logos/nissan.svg",
  rangerover: "/brand-logos/rangerover.svg",
  rollsroyce: "/brand-logos/rollsroyce.svg",
  suzuki: "/brand-logos/suzuki.svg",
  toyota: "/brand-logos/toyota.svg",
};
const DEFAULT_BRAND_LOGO = "/brand-logos/default.svg";

const FIELD_KEY_MAP = {
  selected_car_id: "selectedCarId",
  pickup_location: "pickupLocation",
  return_location: "returnLocation",
  pickup_date: "pickupDate",
  return_date: "returnDate",
  selected_services: "selectedServices",
  selected_insurance: "selectedInsurance",
  driving_license_option: "drivingLicenseOption",
  driver_hours: "driverHours",
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  phone: "phone",
  messenger_phone: "messengerPhone",
  national_code: "nationalCode",
  nationality: "nationality",
  notes: "notes",
  "service_quantities.child_seat": "childSeatQuantity",
};

const FIELD_LABELS = {
  selectedCarId: "vehicle", pickupLocation: "pick-up location", returnLocation: "return location",
  pickupDate: "pick-up date", returnDate: "return date", selectedServices: "additional services",
  selectedInsurance: "insurance", drivingLicenseOption: "driving licence option", driverHours: "chauffeur hours",
  firstName: "first name", lastName: "last name", email: "email", phone: "phone number",
  messengerPhone: "WhatsApp / Messenger number", nationalCode: "national ID", nationality: "nationality",
  notes: "notes", childSeatQuantity: "child seat quantity", acceptTerms: "terms acceptance",
};

const STEP_FIELDS = {
  0: ["pickupDate", "returnDate", "pickupLocation", "returnLocation"],
  1: ["selectedCarId"],
  2: [
    "firstName",
    "lastName",
    "email",
    "phone",
    "messengerPhone",
    "nationalCode",
    "nationality",
    "selectedServices",
    "selectedInsurance",
    "drivingLicenseOption",
    "driverHours",
    "childSeatQuantity",
    "notes",
    "acceptTerms",
  ],
};

const EMPTY_FORM = {
  selectedCarId: "",
  pickupDate: "",
  returnDate: "",
  pickupLocation: "",
  returnLocation: "",

  selectedServices: [],
  serviceQuantities: { child_seat: 0 },
  selectedInsurance: "",
  drivingLicenseOption: "",
  driverHours: "",

  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  messengerPhone: "",
  nationalCode: "",
  nationality: "",
  notes: "",
  acceptTerms: false,
};

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

function parseApiDateTime(value) {
  if (!value) return new Date("");
  const normalized = String(value).replace(" ", "T");
  return new Date(normalized);
}

function toApiDateTime(value) {
  return format(value, "yyyy-MM-dd HH:mm:ss");
}

function formatDateTime(value) {
  if (!value) return "—";
  const parsed = parseApiDateTime(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-AE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayStart(baseDate) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0);
}

function dayEnd(baseDate) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59);
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function normalizeValidationErrors(errorBag = {}) {
  const normalized = {};

  Object.entries(errorBag || {}).forEach(([key, messages]) => {
    const text = Array.isArray(messages) ? messages[0] : messages;
    if (!text) return;

    let mapped = FIELD_KEY_MAP[key] || key;

    if (mapped === key) {
      if (key.startsWith("selected_services")) {
        mapped = "selectedServices";
      } else if (key.startsWith("service_quantities.")) {
        const serviceKey = key.replace("service_quantities.", "");
        mapped = serviceKey === "child_seat" ? "childSeatQuantity" : "selectedServices";
      }
    }

    normalized[mapped] = toPersianValidationMessage(String(text), mapped);
  });

  return normalized;
}

function fieldLabel(field) {
  return FIELD_LABELS[field] || "this field";
}

function toPersianValidationMessage(message, field = "") {
  const text = String(message || "").trim();
  if (!text) return "Please enter a valid value.";

  const conflictMatch = text.match(/already reserved from\s+(.+?)\s+to\s+(.+?)\.?$/i);
  if (conflictMatch) {
    return `This vehicle is already reserved from ${conflictMatch[1]} to ${conflictMatch[2]}.`;
  }

  if (/selected vehicle is not available/i.test(text)) {
    return "The selected vehicle is unavailable for these dates.";
  }

  if (/service quantity key is invalid/i.test(text)) {
    return "The selected service quantity is invalid.";
  }

  if (/field is required/i.test(text)) {
    return `Please enter your ${fieldLabel(field)}.`;
  }

  if (/field must be a valid email/i.test(text) || /field must be a valid email address/i.test(text)) {
    return "Please enter a valid email address.";
  }

  if (/field format is invalid/i.test(text)) {
    return `Please check the format of your ${fieldLabel(field)}.`;
  }

  if (/field must be a date after/i.test(text)) {
    return "Return date and time must be after pick-up.";
  }

  if (/field must be a date/i.test(text)) {
    return `Please check the format of your ${fieldLabel(field)}.`;
  }

  if (/field must be an integer/i.test(text) || /field must be a number/i.test(text)) {
    return `${fieldLabel(field)} must be a number.`;
  }

  if (/field must be at least 0/i.test(text)) {
    return `${fieldLabel(field)} cannot be less than zero.`;
  }

  if (/field may not be greater than/i.test(text) || /field must not be greater than/i.test(text)) {
    return `${fieldLabel(field)} is above the allowed limit.`;
  }

  if (/The selected .* is invalid/i.test(text)) {
    return `The selected ${fieldLabel(field)} is invalid.`;
  }

  return `Please check your ${fieldLabel(field)}.`;
}

function toPersianErrorText(message, fallback) {
  const translated = toPersianValidationMessage(message, "");
  if (!translated || translated === "Please check your this field.") {
    return fallback;
  }

  return translated;
}

function normalizePhoneInput(value) {
  const raw = String(value || "");
  const compact = raw.replace(/[\s()-]/g, "");

  if (!compact) return "";

  if (compact.startsWith("+")) {
    return `+${compact.slice(1).replace(/\D/g, "")}`;
  }

  return compact.replace(/\D/g, "");
}

function toApiPhone(value) {
  const normalized = normalizePhoneInput(value);
  if (!normalized) return "";
  return normalized.startsWith("+") ? normalized : `+${normalized}`;
}

function quotePayloadFromForm(form) {
  return {
    selected_car_id: Number(form.selectedCarId),
    pickup_location: form.pickupLocation,
    return_location: form.returnLocation,
    pickup_date: form.pickupDate,
    return_date: form.returnDate,
    selected_services: form.selectedServices,
    service_quantities: {
      child_seat: Math.max(0, Number(form.serviceQuantities.child_seat || 0)),
    },
    selected_insurance: form.selectedInsurance,
    driving_license_option: form.drivingLicenseOption || null,
    driver_hours: Number(form.driverHours || 0),
    apply_discount: false,
    custom_daily_rate: null,
  };
}

function submitPayloadFromForm(form, bootstrapData) {
  return {
    ...quotePayloadFromForm(form),
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    email: form.email.trim() || null,
    phone: toApiPhone(form.phone),
    messenger_phone: toApiPhone(form.messengerPhone),
    national_code: form.nationalCode.trim(),
    nationality: form.nationality.trim(),
    notes: form.notes.trim() || null,
    kardo_required: true,
    payment_on_delivery: true,
    agent_id: bootstrapData?.default_agent_id || null,
    submitted_by_name: "Website",
  };
}

function getApiOrigin() {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return window.location.origin;
  }
}

function fallbackImageUrl() {
  const origin = getApiOrigin();
  return `${origin}/assets/car-pics/car%20test.webp`;
}

function insuranceTierPrice(selectedCar, insuranceId, rentalDays) {
  if (!selectedCar) return 0;

  const source =
    insuranceId === "ldw_insurance"
      ? selectedCar.insurance_pricing?.ldw
      : selectedCar.insurance_pricing?.scdw;

  if (!source) return 0;

  if (rentalDays >= 28) return Number(source.long || source.mid || source.short || 0);
  if (rentalDays >= 7) return Number(source.mid || source.short || 0);
  return Number(source.short || 0);
}

function getErrorText(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return "Please enter a valid value.";
}

function normalizeBrandKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function brandLogoPath(brand) {
  const normalized = normalizeBrandKey(brand);
  if (!normalized) return "";
  return BRAND_LOGO_PATHS[normalized] || "";
}

function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sameLocation, setSameLocation] = useState(true);
  const [bootstrapRetry, setBootstrapRetry] = useState(0);
  const [bootstrapError, setBootstrapError] = useState("");

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const [bootstrapData, setBootstrapData] = useState(null);
  const [cars, setCars] = useState([]);
  const [carFilters, setCarFilters] = useState({
    search: "",
    brand: "all",
    availability: "all",
    gear: "all",
    sort: "recommended",
  });

  const [isBootstrapLoading, setBootstrapLoading] = useState(true);
  const [isCarsLoading, setCarsLoading] = useState(false);
  const [isQuoteLoading, setQuoteLoading] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  const [quote, setQuote] = useState(null);
  const quoteAbortRef = useRef(null);

  const fallbackCarImage = useMemo(() => fallbackImageUrl(), []);

  const locationOptions = bootstrapData?.location_options || [];
  const availableCarsCount = useMemo(
    () => cars.filter((car) => car.is_available_for_selection !== false).length,
    [cars]
  );

  const brandFilterOptions = useMemo(() => {
    const map = new Map();

    cars.forEach((car) => {
      const raw = String(car?.car_model?.brand || "").trim();
      if (!raw) return;

      const key = normalizeBrandKey(raw);
      const previous = map.get(key);
      if (previous) {
        previous.count += 1;
      } else {
        map.set(key, { key, label: raw, count: 1 });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [cars]);

  const filteredCars = useMemo(() => {
    const searchValue = carFilters.search.trim().toLowerCase();
    const selectedBrand = carFilters.brand;
    const availability = carFilters.availability;
    const gear = carFilters.gear;

    let list = cars.filter((car) => {
      if (selectedBrand !== "all") {
        const carBrand = normalizeBrandKey(car?.car_model?.brand || "");
        if (carBrand !== selectedBrand) return false;
      }

      if (availability === "available" && car.is_available_for_selection === false) {
        return false;
      }

      if (availability === "unavailable" && car.is_available_for_selection !== false) {
        return false;
      }

      if (gear !== "all") {
        const carGear = String(car?.options?.gear || "").toLowerCase();
        if (carGear !== gear) return false;
      }

      if (searchValue) {
        const haystack = [
          car?.car_model?.brand,
          car?.car_model?.model,
          car?.plate_number,
          car?.car_model?.brand && car?.car_model?.model
            ? `${car.car_model.brand} ${car.car_model.model}`
            : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchValue)) return false;
      }

      return true;
    });

    const selectedId = String(form.selectedCarId || "");
    const comparePrice = (car) => Number(car?.pricing?.short || 0);

    list = [...list].sort((left, right) => {
      if (carFilters.sort === "price_asc") return comparePrice(left) - comparePrice(right);
      if (carFilters.sort === "price_desc") return comparePrice(right) - comparePrice(left);
      if (carFilters.sort === "brand_az") {
        const leftName = `${left?.car_model?.brand || ""} ${left?.car_model?.model || ""}`.trim();
        const rightName = `${right?.car_model?.brand || ""} ${right?.car_model?.model || ""}`.trim();
        return leftName.localeCompare(rightName);
      }

      if (String(left.id) === selectedId) return -1;
      if (String(right.id) === selectedId) return 1;

      const leftAvailable = left.is_available_for_selection !== false ? 1 : 0;
      const rightAvailable = right.is_available_for_selection !== false ? 1 : 0;
      if (leftAvailable !== rightAvailable) return rightAvailable - leftAvailable;

      return comparePrice(left) - comparePrice(right);
    });

    return list;
  }, [cars, carFilters, form.selectedCarId]);

  const isSelectedCarHiddenByFilter = useMemo(() => {
    if (!form.selectedCarId) return false;
    return !filteredCars.some((car) => String(car.id) === String(form.selectedCarId));
  }, [filteredCars, form.selectedCarId]);

  const addonServices = useMemo(() => {
    if (!bootstrapData?.services) return [];
    return bootstrapData.services.filter(
      (service) => !service.is_insurance && service.id !== "child_seat"
    );
  }, [bootstrapData]);

  const insuranceServices = useMemo(() => {
    if (!bootstrapData?.services) return [];
    return bootstrapData.services.filter((service) => service.is_insurance);
  }, [bootstrapData]);

  const drivingLicenseOptions = useMemo(() => {
    if (!bootstrapData?.driving_license_options) return [];

    return Object.entries(bootstrapData.driving_license_options).map(([key, value]) => ({
      key,
      label: value.label,
      amount: Number(value.amount || 0),
    }));
  }, [bootstrapData]);

  const selectedCar = useMemo(
    () => cars.find((car) => String(car.id) === String(form.selectedCarId)) || null,
    [cars, form.selectedCarId]
  );

  const pickupDateValue = useMemo(() => parseApiDateTime(form.pickupDate), [form.pickupDate]);
  const returnDateValue = useMemo(() => parseApiDateTime(form.returnDate), [form.returnDate]);

  const minPickupAt = useMemo(() => {
    const parsed = parseApiDateTime(bootstrapData?.min_pickup_at || "");
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [bootstrapData?.min_pickup_at]);

  const pickupDateForTime = !Number.isNaN(pickupDateValue.getTime()) ? pickupDateValue : minPickupAt;
  const pickupMinTime = isSameDay(pickupDateForTime, minPickupAt) ? minPickupAt : dayStart(pickupDateForTime);
  const pickupMaxTime = dayEnd(pickupDateForTime);

  const returnDateForTime = !Number.isNaN(returnDateValue.getTime())
    ? returnDateValue
    : !Number.isNaN(pickupDateValue.getTime())
      ? pickupDateValue
      : minPickupAt;

  const hasValidPickup = !Number.isNaN(pickupDateValue.getTime());
  const returnMinTime =
    hasValidPickup && isSameDay(returnDateForTime, pickupDateValue)
      ? pickupDateValue
      : dayStart(returnDateForTime);
  const returnMaxTime = dayEnd(returnDateForTime);

  const rentalDays = useMemo(() => {
    if (!form.pickupDate || !form.returnDate) return 1;

    const pickup = parseApiDateTime(form.pickupDate).getTime();
    const returned = parseApiDateTime(form.returnDate).getTime();

    if (!Number.isFinite(pickup) || !Number.isFinite(returned) || returned <= pickup) return 1;

    return Math.max(1, Math.ceil((returned - pickup) / 86400000));
  }, [form.pickupDate, form.returnDate]);

  const canRequestQuote = useMemo(
    () =>
      !!(
        form.selectedCarId &&
        form.pickupDate &&
        form.returnDate &&
        form.pickupLocation &&
        form.returnLocation
      ),
    [
      form.selectedCarId,
      form.pickupDate,
      form.returnDate,
      form.pickupLocation,
      form.returnLocation,
    ]
  );

  const quotePayload = useMemo(() => quotePayloadFromForm(form), [form]);
  const stepCompletionPercent = useMemo(
    () => Math.round(((currentStep + 1) / STEPS.length) * 100),
    [currentStep]
  );

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    async function loadInitialData() {
      setBootstrapLoading(true);

      try {
        const bootstrapPayload = await fetchBootstrap(controller.signal);

        if (!isMounted) return;

        setBootstrapData(bootstrapPayload);
        setBootstrapError("");
        setSubmitError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setBootstrapError(
          `We could not load reservation details: ${toPersianErrorText(
            error.message,
            "Please check your connection and try again."
          )}`
        );
      } finally {
        if (isMounted) setBootstrapLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [bootstrapRetry]);

  useEffect(() => {
    if (!bootstrapData) return;

    const controller = new AbortController();
    setCarsLoading(true);

    fetchCars(
      {
        modelId: null,
        pickupDate: form.pickupDate || null,
        returnDate: form.returnDate || null,
      },
      controller.signal
    )
      .then((items) => {
        const list = items || [];
        setCars(list);

        setForm((prev) => {
          if (!prev.selectedCarId) return prev;

          const stillExists = list.some((car) => String(car.id) === String(prev.selectedCarId));
          if (stillExists) return prev;

          return { ...prev, selectedCarId: "" };
        });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setSubmitError(
          `We could not load vehicles: ${toPersianErrorText(
            error.message,
            "Please try again in a moment."
          )}`
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarsLoading(false);
      });

    return () => controller.abort();
  }, [bootstrapData, form.pickupDate, form.returnDate]);

  useEffect(() => {
    if (!canRequestQuote) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }

    if (quoteAbortRef.current) {
      quoteAbortRef.current.abort();
    }

    const controller = new AbortController();
    quoteAbortRef.current = controller;
    setQuoteLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchQuote(quotePayload, controller.signal);
        setQuote(result);
        setSubmitError("");
      } catch (error) {
        if (controller.signal.aborted) return;

        if (isValidationApiError(error)) {
          setErrors((prev) => ({ ...prev, ...normalizeValidationErrors(error.errors) }));
          setSubmitError("Please review the highlighted fields and try again.");
          setQuote(null);
          return;
        }

        setQuote(null);
        setSubmitError(
          `We could not update your estimate: ${toPersianErrorText(
            error.message,
            "Please try again."
          )}`
        );
      } finally {
        if (!controller.signal.aborted) setQuoteLoading(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canRequestQuote, quotePayload]);

  function clearFieldError(field) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "pickupLocation" && sameLocation ? { returnLocation: value } : {}),
    }));
    clearFieldError(field);
    setSubmitError("");
  }

  function toggleService(serviceId, checked) {
    setForm((prev) => {
      const set = new Set(prev.selectedServices);
      if (checked) set.add(serviceId);
      else set.delete(serviceId);

      return {
        ...prev,
        selectedServices: Array.from(set),
      };
    });
  }

  function updateServiceQuantity(serviceId, value) {
    const normalized = Math.max(0, Number(value || 0));

    setForm((prev) => ({
      ...prev,
      serviceQuantities: {
        ...prev.serviceQuantities,
        [serviceId]: normalized,
      },
    }));

    clearFieldError("childSeatQuantity");
  }

  function updateCarFilter(key, value) {
    setCarFilters((prev) => ({ ...prev, [key]: value }));
  }

  function resetCarFilters() {
    setCarFilters({
      search: "",
      brand: "all",
      availability: "all",
      gear: "all",
      sort: "recommended",
    });
  }

  function handleCarImageError(event) {
    const target = event.currentTarget;
    const stage = target.dataset.fallbackStage || "initial";

    if (stage === "initial" && fallbackCarImage && !target.src.includes(fallbackCarImage)) {
      target.src = fallbackCarImage;
      target.dataset.fallbackStage = "api";
      return;
    }

    if (stage !== "local" && !target.src.endsWith(LOCAL_CAR_PLACEHOLDER)) {
      target.src = LOCAL_CAR_PLACEHOLDER;
      target.dataset.fallbackStage = "local";
      target.style.objectFit = "contain";
      return;
    }

    target.onerror = null;
  }

  function setStepErrors(stepIndex, nextErrors) {
    setErrors((prev) => {
      const merged = { ...prev };

      (STEP_FIELDS[stepIndex] || []).forEach((field) => {
        delete merged[field];
      });

      return { ...merged, ...nextErrors };
    });
  }

  function stepByField(field) {
    const entries = Object.entries(STEP_FIELDS);
    for (const [step, fields] of entries) {
      if (fields.includes(field)) return Number(step);
    }

    return STEPS.length - 1;
  }

  function validateStep(stepIndex) {
    const nextErrors = {};

    if (stepIndex === 0) {
      if (!form.pickupDate) nextErrors.pickupDate = "Choose a pick-up date and time.";
      if (!form.returnDate) nextErrors.returnDate = "Choose a return date and time.";
      if (!form.pickupLocation) nextErrors.pickupLocation = "Choose a pick-up location.";
      if (!form.returnLocation) nextErrors.returnLocation = "Choose a return location.";

      if (form.pickupDate) {
        const pickup = parseApiDateTime(form.pickupDate);
        if (Number.isNaN(pickup.getTime())) {
          nextErrors.pickupDate = "Choose a valid pick-up date and time.";
        } else if (pickup < minPickupAt) {
          nextErrors.pickupDate = "Pick-up must be after the earliest available time.";
        }
      }

      if (form.pickupDate && form.returnDate) {
        const pickup = parseApiDateTime(form.pickupDate).getTime();
        const returned = parseApiDateTime(form.returnDate).getTime();
        if (pickup >= returned) {
          nextErrors.returnDate = "Return must be after pick-up.";
        }
      }
    }

    if (stepIndex === 1) {
      if (!form.selectedCarId) {
        nextErrors.selectedCarId = "Select a vehicle to continue.";
      }

      if (selectedCar && selectedCar.is_available_for_selection === false) {
        nextErrors.selectedCarId = "This vehicle is unavailable for your selected dates.";
      }
    }

    if (stepIndex === 2) {
      if (!form.firstName.trim()) nextErrors.firstName = "Enter your first name.";
      if (!form.lastName.trim()) nextErrors.lastName = "Enter your last name.";
      if (!form.phone.trim()) nextErrors.phone = "Enter your phone number.";
      if (!form.messengerPhone.trim()) nextErrors.messengerPhone = "Enter your WhatsApp or Messenger number.";
      if (!form.nationalCode.trim()) nextErrors.nationalCode = "Enter your national ID or identification.";
      if (!form.nationality.trim()) nextErrors.nationality = "Enter your nationality.";

      const normalizedPhone = toApiPhone(form.phone);
      const normalizedMessenger = toApiPhone(form.messengerPhone);

      if (form.phone && !PHONE_REGEX.test(normalizedPhone)) {
        nextErrors.phone = "Use an international phone number starting with + (8–15 digits).";
      }

      if (form.messengerPhone && !PHONE_REGEX.test(normalizedMessenger)) {
        nextErrors.messengerPhone = "Use an international phone number starting with + (8–15 digits).";
      }

      if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
        nextErrors.email = "Enter a valid email address.";
      }

      if (Number(form.driverHours || 0) < 0) {
        nextErrors.driverHours = "Chauffeur hours cannot be negative.";
      }

      if (Number(form.serviceQuantities.child_seat || 0) < 0) {
        nextErrors.childSeatQuantity = "Enter a valid child seat quantity.";
      }

      if (!form.acceptTerms) {
        nextErrors.acceptTerms = "Accept the reservation terms to send your request.";
      }
    }

    setStepErrors(stepIndex, nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function goNext() {
    setSubmitError("");

    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function goBack() {
    setSubmitError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!bootstrapData) {
      setSubmitError("Reservation details are still loading. Please try again in a moment.");
      return;
    }

    if (currentStep !== STEPS.length - 1) {
      goNext();
      return;
    }

    for (let step = 0; step < STEPS.length; step += 1) {
      const valid = validateStep(step);
      if (!valid) {
        setCurrentStep(step);
        setSubmitError("Please fix the highlighted fields and try again.");
        return;
      }
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload = submitPayloadFromForm(form, bootstrapData);
      const result = await createReservation(payload);
      setSubmitSuccess(result);
    } catch (error) {
      if (isValidationApiError(error)) {
        const serverErrors = normalizeValidationErrors(error.errors);
        setErrors((prev) => ({ ...prev, ...serverErrors }));
        setSubmitError("Please fix the highlighted fields and try again.");

        const firstServerField = Object.keys(serverErrors)[0];
        if (firstServerField) {
          setCurrentStep(stepByField(firstServerField));
        }
      } else {
        setSubmitError(
          toPersianErrorText(error.message, "We could not send your request. Please try again.")
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setCurrentStep(0);
    setErrors({});
    setSubmitError("");
    setSubmitSuccess(null);
    setQuote(null);
    resetCarFilters();
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  if (isBootstrapLoading) {
    return (
      <main className="kp-page kp-page--loading" dir="ltr">
        <section className="kp-loading">
          <div className="kp-loading__spinner" />
          <h2>Preparing your reservation</h2>
          <p>Loading live vehicle and location details…</p>
        </section>
      </main>
    );
  }

  if (bootstrapError) {
    return (
      <main className="kp-page" dir="ltr">
        <KaraHeader open={isMobileMenuOpen} onToggle={() => setMobileMenuOpen((value) => !value)} onClose={closeMobileMenu} />
        <ReservationHero />
        <section className="kp-start-error" role="alert">
          <p className="kp-start-error__eyebrow">Reservation service unavailable</p>
          <h2>We could not start your reservation</h2>
          <p>{bootstrapError}</p>
          <button type="button" className="kp-btn kp-btn--primary" onClick={() => setBootstrapRetry((value) => value + 1)}>Try again</button>
        </section>
        <KaraFooter />
      </main>
    );
  }

  return (
    <main className="kp-page" dir="ltr">
      <KaraHeader open={isMobileMenuOpen} onToggle={() => setMobileMenuOpen((value) => !value)} onClose={closeMobileMenu} />
      <header className="header fixed kp-theme-header">
        <div className="header-wrapper">
          <div className="kp-theme-container">
            <div className="logo">
              <a href="https://newsite.karaplus.ae/" target="_blank" rel="noreferrer">
                <img
                  src="/kara-plus-logo.png"
                  alt="Kara Plus Rent a Car"
                />
              </a>
            </div>

            <button
              type="button"
              className="menu-toggle btn btn-theme-transparent"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="باز و بسته کردن منو"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="kp-theme-icon">☰</span>
            </button>

            <nav className={`navigation clearfix ${isMobileMenuOpen ? "opened" : "closed"}`}>
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <button
                    type="button"
                    className="menu-toggle-close btn"
                    onClick={closeMobileMenu}
                    aria-label="بستن منو"
                  >
                    <span className="kp-theme-icon">✕</span>
                  </button>

                  <nav
                    id="ubermenu-main-118-rentit_topmenu-2"
                    className="ubermenu ubermenu-nojs ubermenu-main ubermenu-menu-118 ubermenu-loc-rentit_topmenu ubermenu-responsive ubermenu-responsive-default ubermenu-responsive-nocollapse ubermenu-horizontal ubermenu-transition-shift ubermenu-trigger-hover_intent ubermenu-skin-minimal ubermenu-bar-align-full ubermenu-items-align-center ubermenu-bound ubermenu-disable-submenu-scroll ubermenu-sub-indicators ubermenu-retractors-responsive ubermenu-submenu-indicator-closes"
                  >
                    <ul id="ubermenu-nav-main-118-rentit_topmenu" className="ubermenu-nav" data-title="Main Menu">
                      <li className="ubermenu-item ubermenu-item-level-0 ubermenu-column ubermenu-column-auto ubermenu-current-menu-item">
                        <a className="ubermenu-target ubermenu-item-layout-default ubermenu-item-layout-text_only" href={MENU_ITEMS[0].href} target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
                          <span className="ubermenu-target-title ubermenu-target-text">{MENU_ITEMS[0].label}</span>
                        </a>
                      </li>
                      <li className="ubermenu-item ubermenu-item-level-0 ubermenu-column ubermenu-column-auto">
                        <a className="ubermenu-target ubermenu-item-layout-default ubermenu-item-layout-text_only" href={MENU_ITEMS[1].href} target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
                          <span className="ubermenu-target-title ubermenu-target-text">{MENU_ITEMS[1].label}</span>
                        </a>
                      </li>
                      <li className="ubermenu-item ubermenu-item-level-0 ubermenu-column ubermenu-column-auto ubermenu-item-has-children ubermenu-has-submenu-drop ubermenu-has-submenu-flyout ubermenu-submenu-rtl ubermenu-submenu-reverse">
                        <span className="ubermenu-target ubermenu-item-layout-default ubermenu-item-layout-text_only">
                          <span className="ubermenu-target-title ubermenu-target-text">سطوح قیمتی خودروها</span>
                          <span className="ubermenu-sub-indicator">⌄</span>
                        </span>
                        <ul className="ubermenu-submenu ubermenu-submenu-type-flyout ubermenu-submenu-drop ubermenu-submenu-align-right_edge_item ubermenu-submenu-retractor-top">
                          {PRICE_MENU_ITEMS.map((item) => (
                            <li key={item.label} className="ubermenu-item ubermenu-item-auto ubermenu-item-normal ubermenu-item-level-1">
                              <a className="ubermenu-target ubermenu-item-layout-default ubermenu-item-layout-text_only" href={item.href} target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
                                <span className="ubermenu-target-title ubermenu-target-text">{item.label}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </li>
                      {MENU_ITEMS.slice(2).map((item) => (
                        <li key={item.label} className="ubermenu-item ubermenu-item-level-0 ubermenu-column ubermenu-column-auto">
                          <a className="ubermenu-target ubermenu-item-layout-default ubermenu-item-layout-text_only" href={item.href} target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
                            <span className="ubermenu-target-title ubermenu-target-text">{item.label}</span>
                          </a>
                        </li>
                      ))}
                      <li className="ubermenu-item ubermenu-item-level-0 ubermenu-column ubermenu-column-auto ubermenu-item-has-children ubermenu-has-submenu-drop ubermenu-has-submenu-flyout kp-account-item">
                        <a className="ubermenu-target ubermenu-target-with-image ubermenu-item-layout-default ubermenu-item-layout-image_only" href="https://newsite.karaplus.ae/contact/" target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
                          <img
                            className="ubermenu-image ubermenu-image-size-variation_swatches_image_size"
                            src="/kara-plus-logo.png"
                            width="20"
                            height="20"
                            alt="لوگوی ثبت نام و ورود به سایت کارا پلاس"
                          />
                          <span className="ubermenu-sub-indicator">⌄</span>
                        </a>
                        <ul className="ubermenu-submenu ubermenu-submenu-type-flyout ubermenu-submenu-drop ubermenu-submenu-align-left_edge_item ubermenu-submenu-retractor-top">
                          <li className="ubermenu-item ubermenu-item-auto ubermenu-item-normal ubermenu-item-level-1">
                            <a className="ubermenu-target ubermenu-item-layout-default ubermenu-item-layout-text_only" href="https://newsite.karaplus.ae/contact/" target="_blank" rel="noreferrer" onClick={closeMobileMenu}>
                              <span className="ubermenu-target-title ubermenu-target-text">ورود / ثبت نام</span>
                            </a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
              <div className="swiper-scrollbar" />
            </nav>
          </div>
        </div>
      </header>

      <ReservationHero />

      {submitSuccess ? (
        <SuccessState result={submitSuccess} onReset={resetForm} formatMoney={formatMoney} />
      ) : (
        <form className="kp-shell" id="request-form" onSubmit={handleSubmit}>
          <section className="kp-main">
            <div className="kp-stepper">
              <div className="kp-stepper__meta">
                <div>
                  <strong>
                    Step {currentStep + 1} of {STEPS.length}
                  </strong>
                  <small>{STEPS[currentStep]?.title}</small>
                </div>
                <span>{stepCompletionPercent}%</span>
              </div>
              <div className="kp-stepper__progress">
                <span style={{ width: `${stepCompletionPercent}%` }} />
              </div>

              {STEPS.map((step) => {
                const isActive = step.id === currentStep;
                const isDone = step.id < currentStep;

                return (
                  <button
                    key={step.id}
                    type="button"
                    className={`kp-step ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}
                    onClick={() => {
                      if (step.id <= currentStep) setCurrentStep(step.id);
                    }}
                  >
                    <span className="kp-step__index">{step.id + 1}</span>
                    <span className="kp-step__text">
                      <strong>{step.title}</strong>
                      <small>{step.subtitle}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            {submitError ? <p className="kp-alert" role="alert">{submitError}</p> : null}

            {currentStep === 0 ? (
              <article className="kp-panel" id="step-schedule">
                <header className="kp-panel__head">
                  <h2>Plan Your Rental</h2>
                  <p>Set your pick-up and return times, then choose where you would like to collect your vehicle.</p>
                </header>

                <div className="kp-grid kp-grid--two">
                  <label className="kp-field">
                    <span>Pick-up date & time</span>
                    <DatePicker
                      selected={!Number.isNaN(pickupDateValue.getTime()) ? pickupDateValue : null}
                      onChange={(value) => updateField("pickupDate", value ? toApiDateTime(value) : "")}
                      showTimeSelect
                      timeIntervals={30}
                      dateFormat="yyyy/MM/dd HH:mm"
                      minDate={minPickupAt}
                      minTime={pickupMinTime}
                      maxTime={pickupMaxTime}
                      className="kp-date-input"
                      placeholderText="Select pick-up time"
                      autoComplete="off"
                    />
                    <small className="kp-error">{getErrorText(errors.pickupDate)}</small>
                  </label>

                  <label className="kp-field">
                    <span>Return date & time</span>
                    <DatePicker
                      selected={!Number.isNaN(returnDateValue.getTime()) ? returnDateValue : null}
                      onChange={(value) => updateField("returnDate", value ? toApiDateTime(value) : "")}
                      showTimeSelect
                      timeIntervals={30}
                      dateFormat="yyyy/MM/dd HH:mm"
                      minDate={hasValidPickup ? pickupDateValue : minPickupAt}
                      minTime={returnMinTime}
                      maxTime={returnMaxTime}
                      className="kp-date-input"
                      placeholderText="Select return time"
                      autoComplete="off"
                    />
                    <small className="kp-error">{getErrorText(errors.returnDate)}</small>
                  </label>

                  <label className="kp-field">
                    <span>Pick-up location</span>
                    <select
                      value={form.pickupLocation}
                      onChange={(event) => updateField("pickupLocation", event.target.value)}
                    >
                      <option value="">Choose a location</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <small className="kp-error">{getErrorText(errors.pickupLocation)}</small>
                  </label>

                  <label className="kp-field">
                    <span>Return location</span>
                    <select
                      value={form.returnLocation}
                      disabled={sameLocation}
                      onChange={(event) => updateField("returnLocation", event.target.value)}
                    >
                      <option value="">Choose a location</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <small className="kp-error">{getErrorText(errors.returnLocation)}</small>
                  </label>
                </div>
                <label className="kp-same-location">
                  <input type="checkbox" checked={sameLocation} onChange={(event) => {
                    const enabled = event.target.checked;
                    setSameLocation(enabled);
                    if (enabled) updateField("pickupLocation", form.pickupLocation);
                  }} />
                  <span>Return to the same location</span>
                </label>
                {form.pickupDate && form.returnDate ? <p className="kp-rental-duration">{rentalDays}-day rental</p> : null}
              </article>
            ) : null}

            {currentStep === 1 ? (
              <article className="kp-panel" id="step-cars">
                <header className="kp-panel__head">
                  <h2>Choose Your Car</h2>
                  <p>Browse available vehicles, compare key details and select the one that fits your journey.</p>
                </header>

                <div className="kp-car-toolbar">
                  <label className="kp-car-filter-field kp-car-filter-field--search">
                    <span>Search vehicles</span>
                    <input
                      value={carFilters.search}
                      onChange={(event) => updateCarFilter("search", event.target.value)}
                      placeholder="Brand or model"
                    />
                  </label>

                  <label className="kp-car-filter-field">
                    <span>Brand</span>
                    <select
                      value={carFilters.brand}
                      onChange={(event) => updateCarFilter("brand", event.target.value)}
                    >
                      <option value="all">All brands</option>
                      {brandFilterOptions.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label} ({item.count})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="kp-car-filter-field">
                    <span>Availability</span>
                    <select
                      value={carFilters.availability}
                      onChange={(event) => updateCarFilter("availability", event.target.value)}
                    >
                      <option value="all">All vehicles</option>
                      <option value="available">Available now</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </label>

                  <label className="kp-car-filter-field">
                    <span>Transmission</span>
                    <select
                      value={carFilters.gear}
                      onChange={(event) => updateCarFilter("gear", event.target.value)}
                    >
                      <option value="all">Any transmission</option>
                      <option value="automatic">Automatic</option>
                      <option value="manual">Manual</option>
                    </select>
                  </label>

                  <label className="kp-car-filter-field">
                    <span>Sort by</span>
                    <select
                      value={carFilters.sort}
                      onChange={(event) => updateCarFilter("sort", event.target.value)}
                    >
                      <option value="recommended">Recommended</option>
                      <option value="price_asc">Lowest price</option>
                      <option value="price_desc">Highest price</option>
                      <option value="brand_az">Brand A–Z</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    className="kp-btn kp-btn--outline kp-car-filter-reset"
                    onClick={resetCarFilters}
                  >
                    Clear filters
                  </button>
                </div>

                <div className="kp-filter-meta kp-filter-meta--stats">
                  <strong>
                    {filteredCars.length} / {cars.length}
                  </strong>
                  <span>{filteredCars.length} vehicles shown</span>
                  <small>{availableCarsCount} available to reserve</small>
                </div>

                <div className="kp-car-scroll">
                  {isCarsLoading ? (
                    <p className="kp-muted">Loading available vehicles…</p>
                  ) : filteredCars.length === 0 ? (
                    <div className="kp-empty">No vehicles match these filters. Try adjusting your search.</div>
                  ) : (
                    <div className="kp-car-list">
                      {filteredCars.map((car, cardIndex) => {
                        const isSelected = String(form.selectedCarId) === String(car.id);
                        const isAvailable = car.is_available_for_selection !== false;
                        const brand = car.car_model?.brand || "";
                        const model = car.car_model?.model || "";
                        const title = `${brand} ${model}`.trim();
                        const logo = brandLogoPath(brand) || DEFAULT_BRAND_LOGO;

                        const chips = [
                          car.options?.gear
                            ? `Transmission: ${car.options.gear === "automatic" ? "Automatic" : "Manual"}`
                            : null,
                          car.options?.seats ? `${car.options.seats} seats` : null,
                          car.options?.doors ? `${car.options.doors} doors` : null,
                          ["1", "true", "yes"].includes(String(car.options?.unlimited_km || "").toLowerCase())
                            ? "Unlimited mileage"
                            : null,
                        ].filter(Boolean);

                        return (
                          <article
                            key={car.id}
                            className={`kp-car ${isSelected ? "is-selected" : ""} ${
                              !isAvailable ? "is-unavailable" : ""
                            }`}
                            style={{ "--kp-card-index": cardIndex % 12 }}
                          >
                            <div className="kp-car__media">
                              <div className="kp-car__brand">
                                <span className="kp-brand-logo">
                                  <img
                                    src={logo}
                                    alt={`${brand || "car"} logo`}
                                    loading="lazy"
                                    onError={(event) => {
                                      if (!event.currentTarget.src.includes(DEFAULT_BRAND_LOGO)) {
                                        event.currentTarget.src = DEFAULT_BRAND_LOGO;
                                      }
                                    }}
                                  />
                                </span>
                                <span>{brand || "Brand"}</span>
                              </div>

                              <img
                                src={car.primary_image_url || fallbackCarImage || LOCAL_CAR_PLACEHOLDER}
                                alt={title || "Car"}
                                loading="lazy"
                                decoding="async"
                                onError={handleCarImageError}
                              />

                              <div className="kp-car__price-tag">
                                <small>From / day</small>
                                <strong>{formatMoney(car.pricing?.short)} AED</strong>
                              </div>
                            </div>

                            <div className="kp-car__content">
                              <div className="kp-car__head">
                                <h3>{title || "Vehicle"}</h3>
                                <span className={`kp-car__status ${isAvailable ? "is-ok" : "is-off"}`}>
                                  {isAvailable ? "Available" : "Unavailable"}
                                </span>
                              </div>


                              <div className="kp-car__prices">
                                <article>
                                  <span>1–6 days</span>
                                  <strong>{formatMoney(car.pricing?.short)} AED</strong>
                                </article>
                                <article>
                                  <span>7–27 days</span>
                                  <strong>{formatMoney(car.pricing?.mid)} AED</strong>
                                </article>
                                <article>
                                  <span>28+ days</span>
                                  <strong>{formatMoney(car.pricing?.long)} AED</strong>
                                </article>
                              </div>

                              <div className="kp-chip-list">
                                {chips.length > 0 ? (
                                  chips.map((chip) => <span key={chip}>{chip}</span>)
                                ) : (
                                  <span>Details coming soon</span>
                                )}
                              </div>

                              {!isAvailable && car.conflicts?.[0] ? (
                                <p className="kp-warning">
                                  Unavailable from {car.conflicts[0].pickup_date} to {car.conflicts[0].return_date}
                                </p>
                              ) : null}

                              <button
                                type="button"
                                className={`kp-btn ${isSelected ? "kp-btn--secondary" : "kp-btn--primary"}`}
                                disabled={!isAvailable}
                                onClick={() => updateField("selectedCarId", String(car.id))}
                              >
                                {isSelected ? "Selected" : isAvailable ? "Select Car" : "Unavailable"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                {isSelectedCarHiddenByFilter ? (
                  <p className="kp-warning kp-warning--filter">
                    Your selected vehicle is hidden by the current filters.
                    <button type="button" onClick={resetCarFilters}>
                      Show it again
                    </button>
                  </p>
                ) : null}

                <small className="kp-error">{getErrorText(errors.selectedCarId)}</small>
              </article>
            ) : null}

            {currentStep === 2 ? (
              <article className="kp-panel" id="step-final">
                <header className="kp-panel__head">
                  <h2>Your Details</h2>
                  <p>Enter your contact details, customise your rental and send your reservation request.</p>
                </header>

                <div className="kp-grid kp-grid--two">
                  <label className="kp-field">
                    <span>First name</span>
                    <input
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(event) => updateField("firstName", event.target.value)}
                    />
                    <small className="kp-error">{getErrorText(errors.firstName)}</small>
                  </label>

                  <label className="kp-field">
                    <span>Last name</span>
                    <input
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(event) => updateField("lastName", event.target.value)}
                    />
                    <small className="kp-error">{getErrorText(errors.lastName)}</small>
                  </label>

                  <label className="kp-field">
                    <span>Phone number</span>
                    <input
                      dir="ltr"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={(event) => updateField("phone", normalizePhoneInput(event.target.value))}
                      placeholder="+9715..."
                    />
                    <small className="kp-error">{getErrorText(errors.phone)}</small>
                  </label>

                  <label className="kp-field">
                    <span>WhatsApp / Messenger number</span>
                    <input
                      dir="ltr"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={form.messengerPhone}
                      onChange={(event) =>
                        updateField("messengerPhone", normalizePhoneInput(event.target.value))
                      }
                      placeholder="+9715..."
                    />
                    <small className="kp-error">{getErrorText(errors.messengerPhone)}</small>
                  </label>

                  <label className="kp-field">
                    <span>National ID / Identification</span>
                    <input
                      autoComplete="off"
                      value={form.nationalCode}
                      onChange={(event) => updateField("nationalCode", event.target.value)}
                    />
                    <small className="kp-error">{getErrorText(errors.nationalCode)}</small>
                  </label>

                  <label className="kp-field">
                    <span>Nationality</span>
                    <input
                      autoComplete="country-name"
                      value={form.nationality}
                      onChange={(event) => updateField("nationality", event.target.value)}
                    />
                    <small className="kp-error">{getErrorText(errors.nationality)}</small>
                  </label>

                  <label className="kp-field kp-field--full">
                    <span>Email (optional)</span>
                    <input
                      dir="ltr"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="name@example.com"
                    />
                    <small className="kp-error">{getErrorText(errors.email)}</small>
                  </label>
                </div>

                <details className="kp-optional" open={false}>
                  <summary>Customize Your Rental</summary>

                  <div className="kp-grid kp-grid--two">
                    <div>
                      <h3 className="kp-subtitle">Additional services</h3>
                      <div className="kp-service-list">
                        {addonServices.map((service) => {
                          const checked = form.selectedServices.includes(service.id);

                          return (
                            <label
                              key={service.id}
                              className={`kp-service-item ${checked ? "is-checked" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => toggleService(service.id, event.target.checked)}
                              />
                              <span>
                                <strong>{service.label_en || service.id}</strong>
                                <small>
                                  {formatMoney(service.amount)} AED {service.per_day ? "per day" : "one time"}
                                </small>
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <label className="kp-field kp-field--inline">
                        <span>Child seat quantity</span>
                        <input
                          type="number"
                          min="0"
                          value={form.serviceQuantities.child_seat}
                          onChange={(event) => updateServiceQuantity("child_seat", event.target.value)}
                        />
                        <small className="kp-error">{getErrorText(errors.childSeatQuantity)}</small>
                      </label>
                    </div>

                    <div>
                      <h3 className="kp-subtitle">Additional insurance</h3>
                      <div className="kp-service-list">
                        <label
                          className={`kp-service-item ${!form.selectedInsurance ? "is-checked" : ""}`}
                        >
                          <input
                            type="radio"
                            name="insurance"
                            checked={!form.selectedInsurance}
                            onChange={() => updateField("selectedInsurance", "")}
                          />
                          <span>
                            <strong>No additional insurance</strong>
                            <small>Base cover only</small>
                          </span>
                        </label>

                        {insuranceServices.map((insurance) => {
                          const checked = form.selectedInsurance === insurance.id;
                          const perDay = insuranceTierPrice(selectedCar, insurance.id, rentalDays);
                          const total = perDay * rentalDays;

                          return (
                            <label
                              key={insurance.id}
                              className={`kp-service-item ${checked ? "is-checked" : ""}`}
                            >
                              <input
                                type="radio"
                                name="insurance"
                                checked={checked}
                                onChange={() => updateField("selectedInsurance", insurance.id)}
                              />
                              <span>
                                <strong>{insurance.label_en || insurance.id}</strong>
                                <small>{formatMoney(total)} AED for {rentalDays} days</small>
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <label className="kp-field">
                        <span>Driving licence option</span>
                        <select
                          value={form.drivingLicenseOption}
                          onChange={(event) => updateField("drivingLicenseOption", event.target.value)}
                        >
                          <option value="">No additional option</option>
                          {drivingLicenseOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label} ({formatMoney(option.amount)} AED)
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="kp-field">
                        <span>Chauffeur hours (optional)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.driverHours}
                          onChange={(event) => updateField("driverHours", event.target.value)}
                          placeholder="For example, 8"
                        />
                        <small className="kp-error">{getErrorText(errors.driverHours)}</small>
                      </label>
                    </div>

                    <label className="kp-field kp-field--full">
                        <span>Notes (optional)</span>
                      <textarea
                        rows={4}
                        value={form.notes}
                        onChange={(event) => updateField("notes", event.target.value)}
                        placeholder="Anything we should know?"
                      />
                    </label>
                  </div>
                </details>

                <label className="kp-terms">
                  <input
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={(event) => updateField("acceptTerms", event.target.checked)}
                  />
                  <span>
                    I have read and accept the reservation terms, deposit, fines and vehicle return policy.
                  </span>
                </label>
                <small className="kp-error">{getErrorText(errors.acceptTerms)}</small>
              </article>
            ) : null}

            <div className="kp-step-actions">
              <button
                type="button"
                className="kp-btn kp-btn--outline"
                onClick={goBack}
                disabled={currentStep === 0 || isSubmitting}
              >
                Back
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button type="button" className="kp-btn kp-btn--primary" onClick={goNext}>
                  Continue
                </button>
              ) : (
                <button type="submit" className="kp-btn kp-btn--primary" disabled={isSubmitting}>
                  {isSubmitting ? "Sending request…" : "Send reservation request"}
                </button>
              )}
            </div>
          </section>

          <aside className="kp-summary">
            <section className="kp-summary__card">
              <h3>Live Booking Summary</h3>

              {selectedCar ? (
                <>
                  <img
                    src={selectedCar.primary_image_url || fallbackCarImage || LOCAL_CAR_PLACEHOLDER}
                    alt={`${selectedCar.car_model?.brand || ""} ${selectedCar.car_model?.model || ""}`}
                    onError={handleCarImageError}
                  />
                  <strong>
                    {selectedCar.car_model?.brand} {selectedCar.car_model?.model}
                  </strong>
                  <small>Vehicle ID: {selectedCar.plate_number || "—"}</small>
                </>
              ) : (
                <p className="kp-muted">Choose a vehicle to see your booking summary.</p>
              )}

              <div className="kp-summary__rows">
                <div>
                  <span>Pick-up</span>
                  <strong>{formatDateTime(form.pickupDate)}</strong>
                </div>
                <div>
                  <span>Return</span>
                  <strong>{formatDateTime(form.returnDate)}</strong>
                </div>
                <div>
                  <span>Rental duration</span>
                  <strong>{rentalDays}-day rental</strong>
                </div>
              </div>

              <div className="kp-summary__quote" aria-live="polite" aria-label="Live price estimate">
                <header>
                  <span>Realtime estimate</span>
                  {isQuoteLoading ? <small>Updating price…</small> : <small>Up to date</small>}
                </header>
                <div>
                  <span>Base rental</span>
                  <strong>{formatMoney(quote?.base_price)} AED</strong>
                </div>
                <div>
                  <span>Extras</span>
                  <strong>{formatMoney(quote?.services_total)} AED</strong>
                </div>
                <div>
                  <span>Insurance</span>
                  <strong>{formatMoney(quote?.insurance_total)} AED</strong>
                </div>
                {Number(quote?.driver_cost || 0) > 0 ? (
                  <div>
                    <span>Chauffeur</span>
                    <strong>{formatMoney(quote.driver_cost)} AED</strong>
                  </div>
                ) : null}
                {Number(quote?.driving_license_cost || 0) > 0 ? (
                  <div>
                    <span>Driving licence</span>
                    <strong>{formatMoney(quote.driving_license_cost)} AED</strong>
                  </div>
                ) : null}
                <div>
                  <span>Transfer</span>
                  <strong>{formatMoney(quote?.transfer_costs?.total)} AED</strong>
                </div>
                <div>
                  <span>VAT</span>
                  <strong>{formatMoney(quote?.tax_amount)} AED</strong>
                </div>
                <div className="kp-summary__total">
                  <span>Estimated Total</span>
                  <strong>{formatMoney(quote?.final_total)} AED</strong>
                </div>
              </div>
            </section>
          </aside>
          <div className="kp-mobile-booking-bar" aria-live="polite">
            <div><span>Estimated total</span><strong>{quote ? `${formatMoney(quote.final_total)} AED` : "Select a car"}</strong></div>
            <button type="submit" className="kp-btn kp-btn--primary">{currentStep === STEPS.length - 1 ? "Send request" : "Continue"}</button>
          </div>
        </form>
      )}

      <footer className="footer">
        <div className="footer-widgets">
          <div className="kp-theme-container">
            <div className="kp-theme-row">
              <div className="widget-odd widget-first widget-1 kp-col-md-3">
                <div className="widget">
                  <a href="https://newsite.karaplus.ae/" target="_blank" rel="noreferrer">
                    <img
                      src="/kara-plus-logo.png"
                      className="image wp-image-13954 attachment-full size-full"
                      alt="اجاره خودرو"
                    />
                  </a>
                </div>
              </div>

              <div className="widget-even widget-2 kp-col-md-3">
                <div className="widget">
                  <h4 className="widget-title">درباره ما</h4>
                  <p>
                    شرکت کارا پلاس با هدف تسهیل شرایط اجاره خودرو برای ایرانیان در خارج از کشور
                    در سال ۲۰۲۲ در کشور امارات متحده عربی ، شهر دبی تاسیس شده است.
                  </p>
                  <p>
                    اين مجموعه در تلاش است تا با ارتقاء سطح خودروهاي تحت مالكيت خود از اقتصادي
                    تا تشريفاتي و بهره گيري از روش هاي مدرن ارائه خدمات، شرايط حمل و نقل آسان و
                    سريع را در دسترس همه افراد قرار دهد.
                  </p>
                  <ul className="social-icons" />
                </div>
              </div>

              <div className="widget-odd widget-3 kp-col-md-3">
                <div className="widget">
                  <div className="widget-categories">
                    <h4 className="widget-title">اطلاعات</h4>
                    <div className="menu-information-container">
                      <ul id="menu-information" className="menu">
                        {INFO_LINKS.map((item) => (
                          <li key={item.label} className="menu-item">
                            <a href={item.href} target="_blank" rel="noreferrer">
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="widget-even widget-last widget-4 footerNews kp-col-md-3">
                <div className="widget">
                  <h4 className="widget-title">خبر نامه</h4>
                  <div className="textwidget">
                    <p>
                      در خبرنامه کارا پلاس شما از آخرین تغییرات قیمت، تخفیفات، خودروهای جدید شرکت
                      و کلیه اخبار مرتبط با حوزه اجاره خودرو در این مجموعه اطلاع حاصل می نمایید.
                    </p>
                    <form onSubmit={(event) => event.preventDefault()}>
                      <div className="khabarname">
                        <p>
                          <span className="wpcf7-form-control-wrap">
                            <input
                              size="40"
                              maxLength="400"
                              className="wpcf7-form-control wpcf7-email wpcf7-validates-as-required wpcf7-text wpcf7-validates-as-email khabar placeholder"
                              placeholder="Enter your Email Here"
                              type="email"
                              dir="ltr"
                            />
                          </span>
                          <input
                            className="wpcf7-form-control wpcf7-submit has-spinner khabarSubmit"
                            type="submit"
                            value="عضویت"
                          />
                        </p>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-meta">
          <div className="kp-theme-container">
            <div className="kp-theme-row">
              <div className="kp-col-sm-12">
                <p className="btn-row text-center" />
                <div className="copyright">© 2016 Rent It — An Rental Car Theme made with passion by airamlou.ir</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <KaraFooter />
    </main>
  );
}

export default App;
