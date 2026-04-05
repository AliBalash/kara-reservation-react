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

const MENU_ITEMS = [
  { label: "کاراپلاس", href: "https://karaplusrental.com/", external: true },
  { label: "همه خودروها", href: "#step-cars", external: false },
  { label: "سوالات متداول", href: "https://karaplusrental.com/faqs/", external: true },
  { label: "مقالات", href: "https://karaplusrental.com/blog/", external: true },
  { label: "درباره ما", href: "https://karaplusrental.com/about-us/", external: true },
  { label: "تماس با ما", href: "https://karaplusrental.com/contact-us/", external: true },
];

const STEPS = [
  {
    id: 0,
    title: "زمان و مسیر",
    subtitle: "تاریخ و محل تحویل/بازگشت",
  },
  {
    id: 1,
    title: "انتخاب خودرو",
    subtitle: "نمایش کامل خودروها و انتخاب مستقیم",
  },
  {
    id: 2,
    title: "ثبت نهایی",
    subtitle: "اطلاعات متقاضی و ارسال درخواست",
  },
];

const PHONE_REGEX = /^\+\d{8,15}$/;

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

  return parsed.toLocaleString("fa-IR", {
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

    normalized[mapped] = String(text);
  });

  return normalized;
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

function scrollToHash(href) {
  if (!href.startsWith("#")) return;

  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function getErrorText(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return "مقدار وارد شده معتبر نیست.";
}

function normalizeBrandKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function brandMonogram(brand) {
  const parts = String(brand || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "KR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function brandLogoPath(brand) {
  const normalized = normalizeBrandKey(brand);
  if (!normalized) return "";
  return BRAND_LOGO_PATHS[normalized] || "";
}

function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentStep, setCurrentStep] = useState(0);

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(null);

  const [bootstrapData, setBootstrapData] = useState(null);
  const [cars, setCars] = useState([]);

  const [isBootstrapLoading, setBootstrapLoading] = useState(true);
  const [isCarsLoading, setCarsLoading] = useState(false);
  const [isQuoteLoading, setQuoteLoading] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);

  const [quote, setQuote] = useState(null);
  const quoteAbortRef = useRef(null);

  const fallbackCarImage = useMemo(() => fallbackImageUrl(), []);

  const locationOptions = bootstrapData?.location_options || [];

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
        setSubmitError("");
      } catch (error) {
        if (controller.signal.aborted) return;
        setSubmitError(`خطا در دریافت اطلاعات اولیه: ${error.message}`);
      } finally {
        if (isMounted) setBootstrapLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

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
        setSubmitError(`خطا در دریافت لیست خودروها: ${error.message}`);
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
        }

        setQuote(null);
        setSubmitError(`خطا در محاسبه قیمت: ${error.message}`);
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
    setForm((prev) => ({ ...prev, [field]: value }));
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
      if (!form.pickupDate) nextErrors.pickupDate = "تاریخ و ساعت تحویل را انتخاب کنید.";
      if (!form.returnDate) nextErrors.returnDate = "تاریخ و ساعت بازگشت را انتخاب کنید.";
      if (!form.pickupLocation) nextErrors.pickupLocation = "محل تحویل را انتخاب کنید.";
      if (!form.returnLocation) nextErrors.returnLocation = "محل بازگشت را انتخاب کنید.";

      if (form.pickupDate) {
        const pickup = parseApiDateTime(form.pickupDate);
        if (Number.isNaN(pickup.getTime())) {
          nextErrors.pickupDate = "فرمت تاریخ تحویل معتبر نیست.";
        } else if (pickup < minPickupAt) {
          nextErrors.pickupDate = "زمان تحویل باید از زمان فعلی بزرگ‌تر باشد.";
        }
      }

      if (form.pickupDate && form.returnDate) {
        const pickup = parseApiDateTime(form.pickupDate).getTime();
        const returned = parseApiDateTime(form.returnDate).getTime();
        if (pickup >= returned) {
          nextErrors.returnDate = "تاریخ بازگشت باید بعد از تاریخ تحویل باشد.";
        }
      }
    }

    if (stepIndex === 1) {
      if (!form.selectedCarId) {
        nextErrors.selectedCarId = "یک خودرو برای رزرو انتخاب کنید.";
      }

      if (selectedCar && selectedCar.is_available_for_selection === false) {
        nextErrors.selectedCarId = "این خودرو در بازه زمانی انتخاب‌شده در دسترس نیست.";
      }
    }

    if (stepIndex === 2) {
      if (!form.firstName.trim()) nextErrors.firstName = "نام الزامی است.";
      if (!form.lastName.trim()) nextErrors.lastName = "نام خانوادگی الزامی است.";
      if (!form.phone.trim()) nextErrors.phone = "شماره تماس الزامی است.";
      if (!form.messengerPhone.trim()) nextErrors.messengerPhone = "شماره پیام‌رسان الزامی است.";
      if (!form.nationalCode.trim()) nextErrors.nationalCode = "کد ملی/شناسه الزامی است.";
      if (!form.nationality.trim()) nextErrors.nationality = "ملیت الزامی است.";

      const normalizedPhone = toApiPhone(form.phone);
      const normalizedMessenger = toApiPhone(form.messengerPhone);

      if (form.phone && !PHONE_REGEX.test(normalizedPhone)) {
        nextErrors.phone = "شماره تماس باید با + شروع شود و ۸ تا ۱۵ رقم داشته باشد.";
      }

      if (form.messengerPhone && !PHONE_REGEX.test(normalizedMessenger)) {
        nextErrors.messengerPhone = "شماره پیام‌رسان باید با + شروع شود و ۸ تا ۱۵ رقم داشته باشد.";
      }

      if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
        nextErrors.email = "ایمیل وارد شده معتبر نیست.";
      }

      if (Number(form.driverHours || 0) < 0) {
        nextErrors.driverHours = "ساعت راننده نمی‌تواند منفی باشد.";
      }

      if (Number(form.serviceQuantities.child_seat || 0) < 0) {
        nextErrors.childSeatQuantity = "تعداد صندلی کودک نامعتبر است.";
      }

      if (!form.acceptTerms) {
        nextErrors.acceptTerms = "برای ثبت درخواست، تایید قوانین ضروری است.";
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
      setSubmitError("اطلاعات اولیه فرم کامل بارگذاری نشده است. لطفا چند ثانیه بعد دوباره تلاش کنید.");
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
        setSubmitError("لطفا خطاهای فرم را برطرف کنید و دوباره تلاش کنید.");
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
        setSubmitError(error.message || "برخی فیلدها معتبر نیستند.");

        const firstServerField = Object.keys(serverErrors)[0];
        if (firstServerField) {
          setCurrentStep(stepByField(firstServerField));
        }
      } else {
        setSubmitError(error.message || "ارسال درخواست با خطا مواجه شد.");
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
  }

  if (isBootstrapLoading) {
    return (
      <main className="kp-page kp-page--loading" dir="rtl">
        <section className="kp-loading">
          <div className="kp-loading__spinner" />
          <h2>در حال بارگذاری اطلاعات رزرو</h2>
          <p>دریافت اطلاعات خودروها از CRM...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="kp-page" dir="rtl">
      <header className="kp-header">
        <div className="kp-header__inner">
          <a className="kp-logo" href="https://karaplusrental.com/" target="_blank" rel="noreferrer">
            <img
              src="https://karaplusrental.com/wp-content/uploads/2023/10/%D8%A7%D8%AC%D8%A7%D8%B1%D9%87-%D8%AE%D9%88%D8%AF%D8%B1%D9%88-1.png"
              alt="Kara Plus"
            />
            <span>کاراپلاس</span>
          </a>

          <nav className="kp-nav">
            {MENU_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(event) => {
                  if (!item.external) {
                    event.preventDefault();
                    scrollToHash(item.href);
                  }
                }}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="kp-header__cta"
            onClick={() => scrollToHash("#request-form")}
          >
            ثبت درخواست
          </button>
        </div>
      </header>

      <section className="kp-hero">
        <div className="kp-hero__overlay" />
        <div className="kp-hero__content">
          <p className="kp-hero__kicker">KARA PLUS RENTAL DUBAI</p>
          <h1>فرم رسمی ثبت درخواست اجاره خودرو</h1>
          <p>
            فرم به‌صورت مرحله‌ای طراحی شده است و تا فیلدهای ضروری کامل نشوند، به مرحله بعد
            منتقل نمی‌شود.
          </p>
        </div>
      </section>

      {submitSuccess ? (
        <section className="kp-success">
          <h2>درخواست شما با موفقیت ثبت شد</h2>
          <p>اطلاعات داخل CRM ذخیره شد و کارشناسان کاراپلاس با شما تماس خواهند گرفت.</p>

          <div className="kp-success__meta">
            <article>
              <span>شماره قرارداد</span>
              <strong>#{submitSuccess.contract_id}</strong>
            </article>
            <article>
              <span>وضعیت</span>
              <strong>{submitSuccess.status}</strong>
            </article>
            <article>
              <span>مبلغ نهایی</span>
              <strong>{formatMoney(submitSuccess.quote?.final_total)} AED</strong>
            </article>
          </div>

          <button type="button" className="kp-btn kp-btn--primary" onClick={resetForm}>
            ثبت درخواست جدید
          </button>
        </section>
      ) : (
        <form className="kp-shell" id="request-form" onSubmit={handleSubmit}>
          <section className="kp-main">
            <div className="kp-stepper">
              <div className="kp-stepper__meta">
                <div>
                  <strong>
                    مرحله {currentStep + 1} از {STEPS.length}
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

            {submitError ? <p className="kp-alert">{submitError}</p> : null}

            {currentStep === 0 ? (
              <article className="kp-panel" id="step-schedule">
                <header className="kp-panel__head">
                  <h2>مرحله ۱: زمان و مسیر</h2>
                  <p>تاریخ و ساعت تحویل/بازگشت و لوکیشن‌ها را مشخص کنید.</p>
                </header>

                <div className="kp-grid kp-grid--two">
                  <label className="kp-field">
                    <span>تاریخ و ساعت تحویل</span>
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
                      placeholderText="انتخاب زمان تحویل"
                      autoComplete="off"
                    />
                    <small className="kp-error">{getErrorText(errors.pickupDate)}</small>
                  </label>

                  <label className="kp-field">
                    <span>تاریخ و ساعت بازگشت</span>
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
                      placeholderText="انتخاب زمان بازگشت"
                      autoComplete="off"
                    />
                    <small className="kp-error">{getErrorText(errors.returnDate)}</small>
                  </label>

                  <label className="kp-field">
                    <span>محل تحویل</span>
                    <select
                      value={form.pickupLocation}
                      onChange={(event) => updateField("pickupLocation", event.target.value)}
                    >
                      <option value="">انتخاب کنید...</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <small className="kp-error">{getErrorText(errors.pickupLocation)}</small>
                  </label>

                  <label className="kp-field">
                    <span>محل بازگشت</span>
                    <select
                      value={form.returnLocation}
                      onChange={(event) => updateField("returnLocation", event.target.value)}
                    >
                      <option value="">انتخاب کنید...</option>
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    <small className="kp-error">{getErrorText(errors.returnLocation)}</small>
                  </label>
                </div>
              </article>
            ) : null}

            {currentStep === 1 ? (
              <article className="kp-panel" id="step-cars">
                <header className="kp-panel__head">
                  <h2>مرحله ۲: انتخاب خودرو</h2>
                  <p>
                    همه خودروها با لوگوی برند و جزئیات کامل نمایش داده می‌شود. کافی است خودرو
                    موردنظر را انتخاب کنید.
                  </p>
                </header>

                <div className="kp-filter-meta">
                  <strong>{cars.length}</strong>
                  <span>خودرو برای نمایش</span>
                </div>

                <div className="kp-car-scroll">
                  {isCarsLoading ? (
                    <p className="kp-muted">در حال دریافت لیست خودروها...</p>
                  ) : cars.length === 0 ? (
                    <div className="kp-empty">در حال حاضر خودرویی برای نمایش موجود نیست.</div>
                  ) : (
                    <div className="kp-car-list">
                      {cars.map((car, cardIndex) => {
                        const isSelected = String(form.selectedCarId) === String(car.id);
                        const isAvailable = car.is_available_for_selection !== false;
                        const brand = car.car_model?.brand || "";
                        const model = car.car_model?.model || "";
                        const title = `${brand} ${model}`.trim();
                        const logo = brandLogoPath(brand);

                        const chips = [
                          car.options?.gear
                            ? `گیربکس: ${car.options.gear === "automatic" ? "اتوماتیک" : "دنده‌ای"}`
                            : null,
                          car.options?.seats ? `صندلی: ${car.options.seats}` : null,
                          car.options?.doors ? `در: ${car.options.doors}` : null,
                          ["1", "true", "yes"].includes(String(car.options?.unlimited_km || "").toLowerCase())
                            ? "مسافت نامحدود"
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
                                  <b>{brandMonogram(brand)}</b>
                                  {logo ? (
                                    <img
                                      src={logo}
                                      alt=""
                                      loading="lazy"
                                      onError={(event) => {
                                        event.currentTarget.style.opacity = "0";
                                      }}
                                    />
                                  ) : null}
                                </span>
                                <span>{brand || "Brand"}</span>
                              </div>

                              <img
                                src={car.primary_image_url || fallbackCarImage}
                                alt={title || "Car"}
                                onError={(event) => {
                                  if (event.currentTarget.src !== fallbackCarImage) {
                                    event.currentTarget.src = fallbackCarImage;
                                  }
                                }}
                              />

                              <div className="kp-car__price-tag">
                                <small>شروع قیمت روزانه</small>
                                <strong>{formatMoney(car.pricing?.short)} AED</strong>
                              </div>
                            </div>

                            <div className="kp-car__content">
                              <div className="kp-car__head">
                                <h3>{title || "بدون عنوان"}</h3>
                                <span className={`kp-car__status ${isAvailable ? "is-ok" : "is-off"}`}>
                                  {isAvailable ? "قابل رزرو" : "غیرقابل رزرو"}
                                </span>
                              </div>

                              <p className="kp-car__plate">پلاک: {car.plate_number || "—"}</p>

                              <div className="kp-car__prices">
                                <article>
                                  <span>۱ تا ۶ روز</span>
                                  <strong>{formatMoney(car.pricing?.short)} AED</strong>
                                </article>
                                <article>
                                  <span>۷ تا ۲۷ روز</span>
                                  <strong>{formatMoney(car.pricing?.mid)} AED</strong>
                                </article>
                                <article>
                                  <span>۲۸ روز به بالا</span>
                                  <strong>{formatMoney(car.pricing?.long)} AED</strong>
                                </article>
                              </div>

                              <div className="kp-chip-list">
                                {chips.length > 0 ? (
                                  chips.map((chip) => <span key={chip}>{chip}</span>)
                                ) : (
                                  <span>امکانات ثبت نشده</span>
                                )}
                              </div>

                              {!isAvailable && car.conflicts?.[0] ? (
                                <p className="kp-warning">
                                  رزرو تداخل دارد: {car.conflicts[0].pickup_date} تا {car.conflicts[0].return_date}
                                </p>
                              ) : null}

                              <button
                                type="button"
                                className={`kp-btn ${isSelected ? "kp-btn--secondary" : "kp-btn--primary"}`}
                                disabled={!isAvailable}
                                onClick={() => updateField("selectedCarId", String(car.id))}
                              >
                                {isSelected ? "انتخاب شده" : "انتخاب خودرو"}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                <small className="kp-error">{getErrorText(errors.selectedCarId)}</small>
              </article>
            ) : null}

            {currentStep === 2 ? (
              <article className="kp-panel" id="step-final">
                <header className="kp-panel__head">
                  <h2>مرحله ۳: اطلاعات نهایی</h2>
                  <p>اطلاعات متقاضی را تکمیل و درخواست را ثبت کنید.</p>
                </header>

                <div className="kp-grid kp-grid--two">
                  <label className="kp-field">
                    <span>نام</span>
                    <input
                      value={form.firstName}
                      onChange={(event) => updateField("firstName", event.target.value)}
                    />
                    <small className="kp-error">{getErrorText(errors.firstName)}</small>
                  </label>

                  <label className="kp-field">
                    <span>نام خانوادگی</span>
                    <input
                      value={form.lastName}
                      onChange={(event) => updateField("lastName", event.target.value)}
                    />
                    <small className="kp-error">{getErrorText(errors.lastName)}</small>
                  </label>

                  <label className="kp-field">
                    <span>شماره تماس</span>
                    <input
                      dir="ltr"
                      value={form.phone}
                      onChange={(event) => updateField("phone", normalizePhoneInput(event.target.value))}
                      placeholder="+9715..."
                    />
                    <small className="kp-error">{getErrorText(errors.phone)}</small>
                  </label>

                  <label className="kp-field">
                    <span>شماره پیام‌رسان</span>
                    <input
                      dir="ltr"
                      value={form.messengerPhone}
                      onChange={(event) =>
                        updateField("messengerPhone", normalizePhoneInput(event.target.value))
                      }
                      placeholder="+9715..."
                    />
                    <small className="kp-error">{getErrorText(errors.messengerPhone)}</small>
                  </label>

                  <label className="kp-field">
                    <span>کد ملی / شناسه</span>
                    <input
                      value={form.nationalCode}
                      onChange={(event) => updateField("nationalCode", event.target.value)}
                    />
                    <small className="kp-error">{getErrorText(errors.nationalCode)}</small>
                  </label>

                  <label className="kp-field">
                    <span>ملیت</span>
                    <input
                      value={form.nationality}
                      onChange={(event) => updateField("nationality", event.target.value)}
                    />
                    <small className="kp-error">{getErrorText(errors.nationality)}</small>
                  </label>

                  <label className="kp-field kp-field--full">
                    <span>ایمیل (اختیاری)</span>
                    <input
                      dir="ltr"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      placeholder="name@example.com"
                    />
                    <small className="kp-error">{getErrorText(errors.email)}</small>
                  </label>
                </div>

                <details className="kp-optional" open={false}>
                  <summary>گزینه‌های تکمیلی (اختیاری)</summary>

                  <div className="kp-grid kp-grid--two">
                    <div>
                      <h3 className="kp-subtitle">خدمات جانبی</h3>
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
                                <strong>{service.label_fa}</strong>
                                <small>
                                  {formatMoney(service.amount)} AED {service.per_day ? "(روزانه)" : "(یک‌بار)"}
                                </small>
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <label className="kp-field kp-field--inline">
                        <span>تعداد صندلی کودک</span>
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
                      <h3 className="kp-subtitle">بیمه تکمیلی</h3>
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
                            <strong>بدون بیمه اضافه</strong>
                            <small>فقط بیمه پایه</small>
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
                                <strong>{insurance.label_fa}</strong>
                                <small>{formatMoney(total)} AED برای {rentalDays} روز</small>
                              </span>
                            </label>
                          );
                        })}
                      </div>

                      <label className="kp-field">
                        <span>گزینه گواهینامه</span>
                        <select
                          value={form.drivingLicenseOption}
                          onChange={(event) => updateField("drivingLicenseOption", event.target.value)}
                        >
                          <option value="">بدون گزینه اضافه</option>
                          {drivingLicenseOptions.map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label} ({formatMoney(option.amount)} AED)
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="kp-field">
                        <span>ساعت راننده (اختیاری)</span>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={form.driverHours}
                          onChange={(event) => updateField("driverHours", event.target.value)}
                          placeholder="مثلا 8"
                        />
                        <small className="kp-error">{getErrorText(errors.driverHours)}</small>
                      </label>
                    </div>

                    <label className="kp-field kp-field--full">
                      <span>توضیحات (اختیاری)</span>
                      <textarea
                        rows={4}
                        value={form.notes}
                        onChange={(event) => updateField("notes", event.target.value)}
                        placeholder="در صورت نیاز توضیح بنویسید..."
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
                    شرایط رزرو و قوانین مربوط به ودیعه، جریمه‌ها و بازگشت خودرو را مطالعه کرده‌ام و
                    می‌پذیرم.
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
                مرحله قبل
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button type="button" className="kp-btn kp-btn--primary" onClick={goNext}>
                  مرحله بعد
                </button>
              ) : (
                <button type="submit" className="kp-btn kp-btn--primary" disabled={isSubmitting}>
                  {isSubmitting ? "در حال ثبت درخواست..." : "ثبت درخواست"}
                </button>
              )}
            </div>
          </section>

          <aside className="kp-summary">
            <section className="kp-summary__card">
              <h3>خلاصه درخواست</h3>

              {selectedCar ? (
                <>
                  <img
                    src={selectedCar.primary_image_url || fallbackCarImage}
                    alt={`${selectedCar.car_model?.brand || ""} ${selectedCar.car_model?.model || ""}`}
                    onError={(event) => {
                      if (event.currentTarget.src !== fallbackCarImage) {
                        event.currentTarget.src = fallbackCarImage;
                      }
                    }}
                  />
                  <strong>
                    {selectedCar.car_model?.brand} {selectedCar.car_model?.model}
                  </strong>
                  <small>پلاک: {selectedCar.plate_number || "—"}</small>
                </>
              ) : (
                <p className="kp-muted">هنوز خودرویی انتخاب نشده است.</p>
              )}

              <div className="kp-summary__rows">
                <div>
                  <span>تحویل</span>
                  <strong>{formatDateTime(form.pickupDate)}</strong>
                </div>
                <div>
                  <span>بازگشت</span>
                  <strong>{formatDateTime(form.returnDate)}</strong>
                </div>
                <div>
                  <span>مدت اجاره</span>
                  <strong>{rentalDays} روز</strong>
                </div>
              </div>

              <div className="kp-summary__quote">
                <header>
                  <span>پیش‌فاکتور لحظه‌ای</span>
                  {isQuoteLoading ? <small>در حال بروزرسانی...</small> : <small>به‌روز</small>}
                </header>
                <div>
                  <span>اجاره پایه</span>
                  <strong>{formatMoney(quote?.base_price)} AED</strong>
                </div>
                <div>
                  <span>خدمات</span>
                  <strong>{formatMoney(quote?.services_total)} AED</strong>
                </div>
                <div>
                  <span>بیمه</span>
                  <strong>{formatMoney(quote?.insurance_total)} AED</strong>
                </div>
                <div>
                  <span>انتقال</span>
                  <strong>{formatMoney(quote?.transfer_costs?.total)} AED</strong>
                </div>
                <div>
                  <span>VAT</span>
                  <strong>{formatMoney(quote?.tax_amount)} AED</strong>
                </div>
                <div className="kp-summary__total">
                  <span>جمع کل</span>
                  <strong>{formatMoney(quote?.final_total)} AED</strong>
                </div>
              </div>
            </section>
          </aside>
        </form>
      )}
    </main>
  );
}

export default App;
