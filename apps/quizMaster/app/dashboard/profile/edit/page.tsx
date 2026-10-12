"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	type FormEvent,
	type ReactNode,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import MaxTryReached from "@/app/(auth)/components/MaxTryReached";
import NotLoginComponent from "@/app/(auth)/components/NotLoginComponent";
import { useUser } from "@/app/(auth)/context/GetUserContext";
import { useDebounce } from "@/app/features/hook/useDebouncer";
import api from "@/app/lib/api";
import Loading from "@/components/Loading";

/* ================= CONSTANTS ================= */

const AVATARS = Array.from({ length: 10 }, (_, i) => `avatar${i + 1}.svg`);
const DEFAULT_AVATAR = AVATARS[0];

// PLACEHOLDER: align these with your backend validation rules
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

const USERNAME_CHECK_DELAY_MS = 500;
const REDIRECT_DELAY_MS = 1500;

/* ================= TYPES ================= */

type FormValues = {
	id: string;
	username: string;
	firstName: string;
	lastName: string;
	email: string;
};

type FieldName = "username" | "firstName" | "lastName" | "email";
type FieldErrors = Partial<Record<FieldName, string>>;

const EDITABLE_FIELDS: FieldName[] = [
	"username",
	"firstName",
	"lastName",
	"email",
];

type UsernameResult = {
	name: string;
	status: "available" | "taken" | "error";
};

/* ================= HELPERS ================= */

// lowercase, only a-z 0-9 _
const sanitizeUsername = (value: string) =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, "")
		.slice(0, USERNAME_MAX_LENGTH);

function validate(values: FormValues): FieldErrors {
	const errors: FieldErrors = {};
	const username = values.username.trim();
	const email = values.email.trim();

	if (!username) {
		errors.username = "Username is required";
	} else if (username.length < USERNAME_MIN_LENGTH) {
		errors.username = `Use at least ${USERNAME_MIN_LENGTH} characters`;
	}

	if (!values.firstName.trim()) errors.firstName = "First name is required";
	if (!values.lastName.trim()) errors.lastName = "Last name is required";

	if (!email) {
		errors.email = "Email is required";
	} else if (!/\S+@\S+\.\S+/.test(email)) {
		errors.email = "Enter a valid email address";
	}

	return errors;
}

const inputClass = (hasError: boolean) =>
	`w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all duration-300 focus:ring-4 ${
		hasError
			? "border-red-300 focus:border-red-400 focus:ring-red-100"
			: "border-gray-200 focus:border-[#7047C7] focus:ring-[#7047C7]/10"
	}`;

/* ================= SMALL PIECES ================= */

// One field = label + input + error/hint, wired together for screen readers.
function TextField({
	name,
	label,
	value,
	onChange,
	error,
	hint,
	type = "text",
	placeholder,
	autoComplete,
	maxLength,
}: {
	name: FieldName;
	label: string;
	value: string;
	onChange: (value: string) => void;
	error?: string;
	hint?: ReactNode;
	type?: string;
	placeholder?: string;
	autoComplete?: string;
	maxLength?: number;
}) {
	const id = `profile-${name}`;
	const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

	return (
		<div>
			<label
				htmlFor={id}
				className="mb-1.5 block text-xs font-semibold text-gray-600"
			>
				{label}
			</label>
			<input
				id={id}
				name={name}
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				autoComplete={autoComplete}
				maxLength={maxLength}
				aria-invalid={Boolean(error)}
				aria-describedby={describedBy}
				className={inputClass(Boolean(error))}
			/>
			{error ? (
				<p id={`${id}-error`} className="mt-1 text-sm text-red-500">
					{error}
				</p>
			) : hint ? (
				<div id={`${id}-hint`} aria-live="polite">
					{hint}
				</div>
			) : null}
		</div>
	);
}

/* ================= PAGE ================= */

const ProfileEditPage = () => {
	const router = useRouter();
	const { user, loading, isLogin, isMaxTryReached, refreshAuth } = useUser();

	// What's currently saved on the server, as form-shaped data
	const initial = useMemo(
		() => ({
			id: user?.id || "",
			username: user?.username || "",
			firstName: user?.firstName || "",
			lastName: user?.lastName || "",
			email: user?.email || "",
			avatar: user?.avatar || DEFAULT_AVATAR,
		}),
		[user],
	);

	const [form, setForm] = useState<FormValues>({
		id: "",
		username: "",
		firstName: "",
		lastName: "",
		email: "",
	});
	const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [errorMsg, setErrorMsg] = useState("");
	const [success, setSuccess] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [usernameResult, setUsernameResult] = useState<UsernameResult | null>(
		null,
	);

	const hydrated = useRef(false);
	const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const debouncedUsername = useDebounce(form.username, USERNAME_CHECK_DELAY_MS);

	/* ---------- Fill the form ONCE when the user first loads ----------
	   (The old effect also depended on `selectedAvatar`, so every avatar click
	   re-ran it, reset the avatar back to the saved one, and wiped typed edits.) */
	useEffect(() => {
		if (!user || hydrated.current) return;
		hydrated.current = true;

		const { avatar, ...values } = initial;
		setForm(values);
		setSelectedAvatar(avatar);
	}, [user, initial]);

	/* ---------- Username availability ---------- */
	useEffect(() => {
		const name = debouncedUsername;
		// No need to check the user's own current username, or an invalid one
		if (!name || name === initial.username || name.length < USERNAME_MIN_LENGTH) {
			return;
		}

		let cancelled = false;

		(async () => {
			try {
				const res = await api.post("/auth/check_username", { username: name });
				if (!cancelled) {
					setUsernameResult({
						name,
						status: res.data?.available ? "available" : "taken",
					});
				}
			} catch {
				if (!cancelled) setUsernameResult({ name, status: "error" });
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [debouncedUsername, initial.username]);

	/* ---------- Derived state ---------- */

	const usernameChanged = form.username !== initial.username;
	const needsUsernameCheck =
		usernameChanged && form.username.length >= USERNAME_MIN_LENGTH;

	// A result only counts if it belongs to what's typed right now,
	// so a stale "available" can never unlock Save for a different name.
	const usernameState: "idle" | "checking" | "available" | "taken" | "error" =
		!needsUsernameCheck
			? "idle"
			: usernameResult?.name === form.username
				? usernameResult.status
				: "checking";

	const isDirty =
		selectedAvatar !== initial.avatar ||
		EDITABLE_FIELDS.some((key) => form[key].trim() !== initial[key]);

	const canSave =
		isDirty &&
		!isSaving &&
		!success &&
		usernameState !== "checking" &&
		usernameState !== "taken";

	/* ---------- Side effects ---------- */

	// Warn before closing/refreshing the tab with unsaved changes
	useEffect(() => {
		if (!isDirty || success) return;
		const onBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};
		window.addEventListener("beforeunload", onBeforeUnload);
		return () => window.removeEventListener("beforeunload", onBeforeUnload);
	}, [isDirty, success]);

	// Don't redirect after the page is gone
	useEffect(() => {
		return () => {
			if (redirectTimer.current) clearTimeout(redirectTimer.current);
		};
	}, []);

	/* ---------- Handlers ---------- */

	const updateField = (name: FieldName, value: string) => {
		setForm((prev) => ({ ...prev, [name]: value }));
		// clear the error for the field being edited
		setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: "" } : prev));
		setErrorMsg("");
	};

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!canSave) return;

		const values: FormValues = {
			...form,
			username: form.username.trim(),
			firstName: form.firstName.trim(),
			lastName: form.lastName.trim(),
			email: form.email.trim(),
		};

		const errors = validate(values);
		const firstInvalid = EDITABLE_FIELDS.find((key) => errors[key]);
		if (firstInvalid) {
			setFieldErrors(errors);
			document.getElementById(`profile-${firstInvalid}`)?.focus();
			return;
		}

		setIsSaving(true);
		setSuccess(false);
		setErrorMsg("");
		setFieldErrors({});

		try {
			const res = await api.post("/auth/edit", {
				...values,
				avatar: selectedAvatar,
			});

			if (res.data?.success) {
				setSuccess(true);
				await refreshAuth?.();
				redirectTimer.current = setTimeout(
					() => router.push("/dashboard"),
					REDIRECT_DELAY_MS,
				);
			} else {
				setErrorMsg(res.data?.message || "Failed to update profile");
			}
		} catch (err: any) {
			// PLACEHOLDER: if your API returns per-field errors
			// (e.g. { errors: { email: "Already in use" } }), map them into
			// setFieldErrors here instead of showing one generic message.
			setErrorMsg(err.response?.data?.message || "Something went wrong.");
		} finally {
			setIsSaving(false);
		}
	};

	/* ---------- State routing ---------- */

	// 1. Loading (highest priority)
	if (loading) {
		return <Loading />;
	}

	// 2. Blocked guest
	if (isMaxTryReached) {
		return <MaxTryReached />;
	}

	// 3. Guests have no profile to edit — only logged-in users
	if (!isLogin || !user) {
		return <NotLoginComponent />;
	}

	/* ---------- Username hint ---------- */

	const usernameHint =
		usernameState === "checking" ? (
			<p className="mt-1 text-sm text-amber-500">Checking username...</p>
		) : usernameState === "available" ? (
			<p className="mt-1 text-sm text-emerald-600">Username is available</p>
		) : usernameState === "taken" ? (
			<p className="mt-1 text-sm text-red-500">
				That username is already taken
			</p>
		) : usernameState === "error" ? (
			<p className="mt-1 text-sm text-gray-500">
				Couldn&apos;t check availability right now. We&apos;ll check again when you
				save.
			</p>
		) : null;

	return (
		<div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-r from-[#340C97] via-[#5B32B4] to-[#7047C7] p-4">
			{/* Ambient glow, echoes the hero's palette */}
			<div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#F0DE4A]/10 blur-3xl" />
			<div className="pointer-events-none absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[#B9EEDC]/10 blur-3xl" />

			<main className="relative z-10 w-full max-w-[620px]">
				<div className="rounded-3xl bg-white p-8 text-gray-900 shadow-2xl">
					{/* Brand mark */}
					<Link
						href="/"
						className="mb-3 inline-flex items-center gap-0.5 text-lg font-extrabold tracking-tight text-[#340C97]"
					>
						{/* PLACEHOLDER: if q-logo.svg is white-only it will vanish on this
						    white card — swap in a dark/coloured variant. */}
						<img src="/q-logo.svg" alt="Q" className="h-8 w-8 object-contain" />
						<span>uizMaster</span>
					</Link>

					<h1 className="mb-4 text-2xl font-bold text-gray-900">Edit Profile</h1>

					<form onSubmit={handleSubmit} noValidate>
						{/* Avatar preview */}
						<div className="mb-3 flex flex-col items-center gap-2">
							<img
								src={`/avatars/${selectedAvatar}`}
								alt="Your selected avatar"
								className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_0_0_3px_rgba(112,71,199,0.35),0_4px_14px_rgba(0,0,0,0.12)]"
							/>
							<p id="avatar-label" className="text-sm text-gray-500">
								Choose your avatar
							</p>
						</div>

						{/* PLACEHOLDER (custom photo): "Upload your own" tile here once
						    you have image upload + storage. */}

						{/* Avatar picker */}
						<div
							role="group"
							aria-labelledby="avatar-label"
							className="mb-6 grid grid-cols-5 justify-items-center gap-2 sm:gap-3"
						>
							{AVATARS.map((avatar, index) => {
								const selected = selectedAvatar === avatar;
								return (
									<button
										key={avatar}
										type="button"
										onClick={() => setSelectedAvatar(avatar)}
										aria-pressed={selected}
										aria-label={`Avatar ${index + 1}`}
										className={`rounded-full border-2 p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7047C7] focus-visible:ring-offset-2 ${
											selected
												? "border-[#7047C7]"
												: "border-transparent hover:border-[#7047C7]/30"
										}`}
									>
										<img
											src={`/avatars/${avatar}`}
											alt=""
											className="h-12 w-12 rounded-full object-cover"
										/>
									</button>
								);
							})}
						</div>

						{/* Fields */}
						<div className="flex flex-col gap-4">
							<TextField
								name="username"
								label="Username"
								value={form.username}
								onChange={(v) => updateField("username", sanitizeUsername(v))}
								error={fieldErrors.username}
								hint={usernameHint}
								placeholder="username"
								autoComplete="username"
								maxLength={USERNAME_MAX_LENGTH}
							/>

							<div className="flex w-full flex-col gap-4 md:flex-row">
								<div className="flex-1">
									<TextField
										name="firstName"
										label="First Name"
										value={form.firstName}
										onChange={(v) => updateField("firstName", v)}
										error={fieldErrors.firstName}
										placeholder="Joe"
										autoComplete="given-name"
									/>
								</div>
								<div className="flex-1">
									<TextField
										name="lastName"
										label="Last Name"
										value={form.lastName}
										onChange={(v) => updateField("lastName", v)}
										error={fieldErrors.lastName}
										placeholder="Doe"
										autoComplete="family-name"
									/>
								</div>
							</div>

							{/* PLACEHOLDER (email change): if you re-verify emails, show a
							    "We'll send a confirmation link" note here when the email
							    differs from the saved one. */}
							<TextField
								name="email"
								label="Email"
								type="email"
								value={form.email}
								onChange={(v) => updateField("email", v)}
								error={fieldErrors.email}
								placeholder="you@example.com"
								autoComplete="email"
							/>
						</div>

						{/* Actions */}
						<div className="pt-6">
							<button
								type="submit"
								disabled={!canSave}
								className="flex w-full items-center justify-center rounded-full bg-[#F0DE4A] px-6 py-3 font-bold tracking-wide text-black shadow-md transition-all duration-300 hover:bg-[#e6d43f] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isSaving ? (
									<span
										role="status"
										aria-label="Saving"
										className="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black"
									/>
								) : (
									"SAVE CHANGES"
								)}
							</button>

							<div className="mt-3 text-center">
								<Link
									href="/dashboard"
									className="text-sm font-semibold text-gray-500 transition hover:text-[#7047C7]"
								>
									Cancel
								</Link>
							</div>
						</div>

						{/* Success / error messages */}
						{success && (
							<div
								role="status"
								className="mt-4 w-full rounded-xl border border-emerald-100 bg-[#B9EEDC]/40 px-4 py-2.5 text-center text-sm text-emerald-700 shadow-sm"
							>
								Changes saved. Taking you back to your dashboard...
							</div>
						)}
						{errorMsg && (
							<div
								role="alert"
								className="mt-4 w-full rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-center text-sm text-red-600 shadow-sm"
							>
								{errorMsg}
							</div>
						)}
					</form>
				</div>
			</main>
		</div>
	);
};

export default ProfileEditPage;