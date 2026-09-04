import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSite } from "@/context/SiteSettingsContext";
import { cn } from "@/lib/utils";

type Fields = {
  name: string;
  phone: string;
  email: string;
  interest: string;
  message: string;
};

const EMPTY: Fields = {
  name: "",
  phone: "",
  email: "",
  interest: "Bridal Collection",
  message: "",
};

const INTERESTS = [
  "Bridal Collection",
  "Gold Jewellery",
  "Diamond Jewellery",
  "Temple Jewellery",
  "Antique Jewellery",
  "Silver Jewellery",
  "Gold exchange or buyback",
  "Repair, polish or resizing",
  "Something else",
];

function validate(values: Fields) {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (values.name.trim().length < 2) errors.name = "Enter your name so we know who to ask for.";
  if (!/^[6-9]\d{9}$/.test(values.phone.replace(/\D/g, "")))
    errors.phone = "Enter a 10-digit Indian mobile number.";
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email))
    errors.email = "That email address does not look right.";
  if (values.message.trim().length < 10)
    errors.message = "Tell us a little more — at least a sentence.";
  return errors;
}

export function ContactForm() {
  const { whatsappLink, primaryPhone } = useSite();

  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [sent, setSent] = useState(false);

  const set = (key: keyof Fields) => (event: { target: { value: string } }) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = () => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Check the highlighted fields", {
        description: "A name, a working mobile number and a sentence about what you need.",
      });
      return;
    }

    const body = [
      `Enquiry from ${values.name.trim()}`,
      `Interest: ${values.interest}`,
      `Phone: ${values.phone.trim()}`,
      values.email.trim() ? `Email: ${values.email.trim()}` : null,
      "",
      values.message.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    // The WhatsApp number is admin-managed. If site settings have not arrived
    // the form says so rather than opening a link built from a guessed number.
    const link = whatsappLink(body);

    if (!link) {
      toast.error("We could not reach the store's server", {
        description: "Please try again in a moment, or call the store directly.",
      });
      return;
    }

    setSent(true);
    toast.success("Enquiry ready to send", {
      description: "WhatsApp will open with your message. Send it and we'll reply the same day.",
    });

    window.open(link, "_blank", "noopener,noreferrer");
  };

  if (sent) {
    return (
      <div className="surface-card p-10 text-center">
        <p className="eyebrow">Thank you</p>
        <h3 className="mt-4 font-display text-2xl text-foreground">Your enquiry is on its way</h3>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          {primaryPhone
            ? `If the WhatsApp window did not open, call us on +91 ${primaryPhone} — someone is at the counter from 10:30 in the morning.`
            : "If the WhatsApp window did not open, the contact page has our current phone number."}
        </p>
        <button
          type="button"
          onClick={() => {
            setValues(EMPTY);
            setSent(false);
          }}
          className="mt-8 text-[0.64rem] font-medium uppercase tracking-[0.22em] text-brand transition-colors hover:text-foreground"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
      className="surface-card p-7 sm:p-9"
    >
      <p className="eyebrow">Send an enquiry</p>
      <h2 className="mt-3 font-display text-2xl text-foreground sm:text-3xl">
        Tell us what you are looking for
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        No account, no payment — this simply opens WhatsApp with your message filled in, so you keep
        the conversation on your own phone.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={errors.name} required>
          <input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={set("name")}
            aria-invalid={Boolean(errors.name)}
            className={inputClass(Boolean(errors.name))}
            placeholder="Sravanthi Reddy"
          />
        </Field>

        <Field label="Mobile number" htmlFor="phone" error={errors.phone} required>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={values.phone}
            onChange={set("phone")}
            aria-invalid={Boolean(errors.phone)}
            className={inputClass(Boolean(errors.phone))}
            placeholder="98765 43210"
          />
        </Field>

        <Field label="Email (optional)" htmlFor="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={set("email")}
            aria-invalid={Boolean(errors.email)}
            className={inputClass(Boolean(errors.email))}
            placeholder="you@example.com"
          />
        </Field>

        <Field label="What are you interested in?" htmlFor="interest">
          <select
            id="interest"
            name="interest"
            value={values.interest}
            onChange={set("interest")}
            className={cn(inputClass(false), "appearance-none")}
          >
            {INTERESTS.map((option) => (
              <option key={option} value={option} className="bg-[#111111]">
                {option}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Your message" htmlFor="message" error={errors.message} required>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={values.message}
              onChange={set("message")}
              aria-invalid={Boolean(errors.message)}
              className={cn(inputClass(Boolean(errors.message)), "resize-y")}
              placeholder="I'm looking for a bridal haaram in the 60–80 gram range for a wedding in November."
            />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        className="mt-8 inline-flex w-full items-center justify-center gap-2.5 bg-primary px-7 py-4 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-primary-foreground transition-colors hover:bg-brand sm:w-auto"
      >
        <Send aria-hidden className="h-4 w-4" /> Send enquiry
      </button>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        We use your details only to reply to this enquiry. Nothing is stored on this website.
      </p>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-foreground/25",
    hasError
      ? "border-destructive focus:border-destructive"
      : "border-brand/20 focus:border-brand/70",
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {label}
        {required ? <span className="ml-1 text-brand">*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
