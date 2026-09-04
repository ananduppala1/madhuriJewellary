import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/client";
import { siteSettings } from "@/api/endpoints";
import { PageHeader } from "@/components/layout/AdminLayout";
import { Button, Card, ErrorState, Input, Skeleton, Textarea } from "@/components/ui";
import { useAsync } from "@/hooks/useAsync";
import type { BusinessHour, SiteSettings } from "@/types";

type FormState = {
  businessName: string;
  legalName: string;
  tagline: string;
  shortDescription: string;
  websiteUrl: string;
  foundedYear: string;
  phones: string[];
  whatsappNumber: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  street: string;
  locality: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  mapsQuery: string;
  hours: BusinessHour[];
  hoursShort: string;
  rating: string;
  ratingCount: string;
};

function fromSettings(settings: SiteSettings): FormState {
  return {
    businessName: settings.business_name,
    legalName: settings.legal_name ?? "",
    tagline: settings.tagline ?? "",
    shortDescription: settings.short_description ?? "",
    websiteUrl: settings.website_url ?? "",
    foundedYear: settings.founded_year ?? "",
    phones: settings.phones.length > 0 ? settings.phones : [""],
    whatsappNumber: settings.whatsapp_number,
    email: settings.email ?? "",
    instagramUrl: settings.instagram_url ?? "",
    facebookUrl: settings.facebook_url ?? "",
    youtubeUrl: settings.youtube_url ?? "",
    street: settings.street ?? "",
    locality: settings.locality ?? "",
    city: settings.city ?? "",
    region: settings.region ?? "",
    postalCode: settings.postal_code ?? "",
    country: settings.country ?? "",
    latitude: settings.latitude === null ? "" : String(settings.latitude),
    longitude: settings.longitude === null ? "" : String(settings.longitude),
    mapsQuery: settings.maps_query ?? "",
    hours: settings.hours.length > 0 ? settings.hours : [{ days: "", time: "" }],
    hoursShort: settings.hours_short ?? "",
    rating: settings.rating === null ? "" : String(settings.rating),
    ratingCount: settings.rating_count === null ? "" : String(settings.rating_count),
  };
}

/**
 * Changing anything here takes effect on the public website within the API's
 * short cache window — no rebuild and no deploy.
 */
export function SiteSettingsPage() {
  const state = useAsync((signal) => siteSettings.get({ signal }), []);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (state.data) setForm(fromSettings(state.data));
  }, [state.data]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  if (state.loading || !form) {
    return (
      <>
        <PageHeader title="Site settings" />
        <div className="space-y-6">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </>
    );
  }

  if (state.error) {
    return (
      <>
        <PageHeader title="Site settings" />
        <Card>
          <ErrorState message={state.error} onRetry={state.reload} />
        </Card>
      </>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const found: Record<string, string> = {};
    if (form.businessName.trim().length < 2) found.businessName = "The business needs a name.";
    if (!/^[0-9]{8,15}$/.test(form.whatsappNumber.trim())) {
      found.whatsappNumber = "Digits only, including the country code — for example 919440964379.";
    }
    const phones = form.phones.map((phone) => phone.trim()).filter(Boolean);
    if (phones.some((phone) => !/^[0-9]{6,15}$/.test(phone))) {
      found.phones = "Phone numbers must be digits only, without spaces or +91.";
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Check the highlighted fields");
      return;
    }

    setSaving(true);
    try {
      await siteSettings.update({
        businessName: form.businessName.trim(),
        legalName: form.legalName.trim() || null,
        tagline: form.tagline.trim() || null,
        shortDescription: form.shortDescription.trim() || null,
        websiteUrl: form.websiteUrl.trim() || null,
        foundedYear: form.foundedYear.trim() || null,
        phones,
        whatsappNumber: form.whatsappNumber.trim(),
        email: form.email.trim() || null,
        instagramUrl: form.instagramUrl.trim() || null,
        facebookUrl: form.facebookUrl.trim() || null,
        youtubeUrl: form.youtubeUrl.trim() || null,
        street: form.street.trim() || null,
        locality: form.locality.trim() || null,
        city: form.city.trim() || null,
        region: form.region.trim() || null,
        postalCode: form.postalCode.trim() || null,
        country: form.country.trim() || null,
        latitude: form.latitude.trim() ? Number(form.latitude) : null,
        longitude: form.longitude.trim() ? Number(form.longitude) : null,
        mapsQuery: form.mapsQuery.trim() || null,
        hours: form.hours.filter((row) => row.days.trim() && row.time.trim()),
        hoursShort: form.hoursShort.trim() || null,
        rating: form.rating.trim() ? Number(form.rating) : null,
        ratingCount: form.ratingCount.trim() ? Number(form.ratingCount) : null,
      });
      toast.success("Settings saved", {
        description: "The website will pick these up within a minute.",
      });
      state.reload();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors);
        toast.error(error.message);
      } else {
        toast.error("Could not save the settings.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Contact details, address and opening hours shown across the website."
        action={
          <Button onClick={handleSubmit} loading={saving} size="sm">
            Save changes
          </Button>
        }
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6 pb-4">
        <Card title="Business">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="businessName"
              label="Business name"
              required
              value={form.businessName}
              onChange={(event) => update("businessName", event.target.value)}
              {...(errors.businessName ? { error: errors.businessName } : {})}
            />
            <Input
              id="legalName"
              label="Legal name"
              value={form.legalName}
              onChange={(event) => update("legalName", event.target.value)}
              {...(errors.legalName ? { error: errors.legalName } : {})}
            />
            <Input
              id="tagline"
              label="Tagline"
              value={form.tagline}
              onChange={(event) => update("tagline", event.target.value)}
              {...(errors.tagline ? { error: errors.tagline } : {})}
            />
            <Input
              id="foundedYear"
              label="Founded"
              value={form.foundedYear}
              onChange={(event) => update("foundedYear", event.target.value)}
              {...(errors.foundedYear ? { error: errors.foundedYear } : {})}
              placeholder="2004"
            />
            <Textarea
              id="shortDescription"
              label="Short description"
              className="sm:col-span-2"
              rows={2}
              value={form.shortDescription}
              onChange={(event) => update("shortDescription", event.target.value)}
              {...(errors.shortDescription ? { error: errors.shortDescription } : {})}
              hint="Used in search results and social previews."
            />
            <Input
              id="websiteUrl"
              label="Website address"
              className="sm:col-span-2"
              value={form.websiteUrl}
              onChange={(event) => update("websiteUrl", event.target.value)}
              {...(errors.websiteUrl ? { error: errors.websiteUrl } : {})}
              placeholder="https://www.madhurijewellers.in"
            />
          </div>
        </Card>

        <Card title="Contact" description="Where customers reach the counter.">
          <div className="space-y-4">
            <div>
              <span className="field-label">Phone numbers</span>
              <div className="space-y-2">
                {form.phones.map((phone, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <label htmlFor={`phone-${index}`} className="sr-only">
                      Phone number {index + 1}
                    </label>
                    <input
                      id={`phone-${index}`}
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(event) => {
                        const next = [...form.phones];
                        next[index] = event.target.value;
                        update("phones", next);
                      }}
                      placeholder="9440964379"
                      className="h-10 flex-1 rounded-md border border-line-strong bg-surface px-3 text-sm focus:border-accent"
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        update(
                          "phones",
                          form.phones.filter((_, i) => i !== index),
                        )
                      }
                      disabled={form.phones.length <= 1}
                      className="text-danger hover:bg-danger-soft"
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                      <span className="sr-only">Remove phone number {index + 1}</span>
                    </Button>
                  </div>
                ))}
              </div>
              {errors.phones ? (
                <p className="field-error">{errors.phones}</p>
              ) : (
                <p className="field-hint">Digits only, no +91 and no spaces.</p>
              )}
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => update("phones", [...form.phones, ""])}
                disabled={form.phones.length >= 5}
              >
                <Plus aria-hidden className="h-3.5 w-3.5" /> Add number
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                id="whatsappNumber"
                label="WhatsApp number"
                required
                value={form.whatsappNumber}
                onChange={(event) => update("whatsappNumber", event.target.value)}
                {...(errors.whatsappNumber ? { error: errors.whatsappNumber } : {})}
                hint="With country code — 919440964379. Every enquiry button uses this."
              />
              <Input
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                {...(errors.email ? { error: errors.email } : {})}
              />
            </div>
          </div>
        </Card>

        <Card title="Social">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="instagramUrl"
              label="Instagram"
              value={form.instagramUrl}
              onChange={(event) => update("instagramUrl", event.target.value)}
              {...(errors.instagramUrl ? { error: errors.instagramUrl } : {})}
              placeholder="https://instagram.com/…"
            />
            <Input
              id="facebookUrl"
              label="Facebook"
              value={form.facebookUrl}
              onChange={(event) => update("facebookUrl", event.target.value)}
              {...(errors.facebookUrl ? { error: errors.facebookUrl } : {})}
            />
            <Input
              id="youtubeUrl"
              label="YouTube"
              value={form.youtubeUrl}
              onChange={(event) => update("youtubeUrl", event.target.value)}
              {...(errors.youtubeUrl ? { error: errors.youtubeUrl } : {})}
            />
          </div>
        </Card>

        <Card title="Address" description="Shown in the footer, contact page and on the map.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="street"
              label="Street"
              className="sm:col-span-2"
              value={form.street}
              onChange={(event) => update("street", event.target.value)}
              {...(errors.street ? { error: errors.street } : {})}
            />
            <Input
              id="locality"
              label="Locality"
              value={form.locality}
              onChange={(event) => update("locality", event.target.value)}
              {...(errors.locality ? { error: errors.locality } : {})}
            />
            <Input
              id="city"
              label="City"
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
              {...(errors.city ? { error: errors.city } : {})}
            />
            <Input
              id="region"
              label="State"
              value={form.region}
              onChange={(event) => update("region", event.target.value)}
              {...(errors.region ? { error: errors.region } : {})}
            />
            <Input
              id="postalCode"
              label="PIN code"
              value={form.postalCode}
              onChange={(event) => update("postalCode", event.target.value)}
              {...(errors.postalCode ? { error: errors.postalCode } : {})}
            />
            <Input
              id="country"
              label="Country code"
              value={form.country}
              onChange={(event) => update("country", event.target.value)}
              {...(errors.country ? { error: errors.country } : {})}
              placeholder="IN"
            />
            <Input
              id="mapsQuery"
              label="Google Maps search"
              value={form.mapsQuery}
              onChange={(event) => update("mapsQuery", event.target.value)}
              {...(errors.mapsQuery ? { error: errors.mapsQuery } : {})}
              hint="Drives the embedded map and the directions link."
            />
            <Input
              id="latitude"
              label="Latitude"
              value={form.latitude}
              onChange={(event) => update("latitude", event.target.value)}
              {...(errors.latitude ? { error: errors.latitude } : {})}
            />
            <Input
              id="longitude"
              label="Longitude"
              value={form.longitude}
              onChange={(event) => update("longitude", event.target.value)}
              {...(errors.longitude ? { error: errors.longitude } : {})}
            />
          </div>
        </Card>

        <Card title="Opening hours">
          <div className="space-y-2">
            {form.hours.map((row, index) => (
              <div key={index} className="flex items-end gap-2">
                <Input
                  id={`hours-days-${index}`}
                  label="Days"
                  className="flex-1"
                  value={row.days}
                  onChange={(event) => {
                    const next = [...form.hours];
                    next[index] = { ...row, days: event.target.value };
                    update("hours", next);
                  }}
                  placeholder="Monday – Saturday"
                />
                <Input
                  id={`hours-time-${index}`}
                  label="Hours"
                  className="flex-1"
                  value={row.time}
                  onChange={(event) => {
                    const next = [...form.hours];
                    next[index] = { ...row, time: event.target.value };
                    update("hours", next);
                  }}
                  placeholder="10:30 am – 9:00 pm"
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    update(
                      "hours",
                      form.hours.filter((_, i) => i !== index),
                    )
                  }
                  disabled={form.hours.length <= 1}
                  className="text-danger hover:bg-danger-soft"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                  <span className="sr-only">Remove row {index + 1}</span>
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => update("hours", [...form.hours, { days: "", time: "" }])}
            disabled={form.hours.length >= 7}
          >
            <Plus aria-hidden className="h-3.5 w-3.5" /> Add row
          </Button>

          <div className="mt-4">
            <Input
              id="hoursShort"
              label="Short summary"
              value={form.hoursShort}
              onChange={(event) => update("hoursShort", event.target.value)}
              {...(errors.hoursShort ? { error: errors.hoursShort } : {})}
              placeholder="Open all week · 10:30 am – 9:00 pm"
            />
          </div>
        </Card>

        <Card
          title="Google rating"
          description="Displayed on the website and in structured data. Keep it matching your real Google Business Profile."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="rating"
              label="Rating"
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={form.rating}
              onChange={(event) => update("rating", event.target.value)}
              {...(errors.rating ? { error: errors.rating } : {})}
            />
            <Input
              id="ratingCount"
              label="Number of reviews"
              type="number"
              min={0}
              value={form.ratingCount}
              onChange={(event) => update("ratingCount", event.target.value)}
              {...(errors.ratingCount ? { error: errors.ratingCount } : {})}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </>
  );
}
