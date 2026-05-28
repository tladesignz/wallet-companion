import {
	array,
	boolean,
	type InferInput,
	nonEmpty,
	nullable,
	number,
	object,
	optional,
	pipe,
	string,
	union,
} from 'valibot';

/**
 * Claims Path Pointer - a non-empty array of strings, nulls, and non-negative integers
 * pointing to claims within a Credential.
 *
 * @see https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-7
 */
const ClaimsPathPointerSchema = pipe(
	array(union([string(), nullable(number()), number()])),
	nonEmpty('Claims path must be a non-empty array'),
);

/**
 * Claims Query - specifies claims in the requested Credential.
 *
 * @see https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6.3
 */
export type DCQLClaimsQuery = InferInput<typeof DCQLClaimsQuerySchema>;
export const DCQLClaimsQuerySchema = object({
	/**
	 * Required if claim_sets is present. Unique identifier for the claim.
	 */
	id: optional(string()),

	/**
	 * Required. Path to the claim within the Credential.
	 */
	path: ClaimsPathPointerSchema,

	/**
	 * Optional. Expected values - Wallet should only return if claim matches.
	 */
	values: optional(pipe(array(union([string(), number(), boolean()])), nonEmpty())),
});

/**
 * Trusted Authorities Query - specifies expected authorities or trust frameworks.
 *
 * @see https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6.1.1
 */
export type DCQLTrustedAuthority = InferInput<typeof DCQLTrustedAuthoritySchema>;
export const DCQLTrustedAuthoritySchema = object({
	/**
	 * Type identifier (e.g., "aki", "etsi_tl", "openid_federation").
	 */
	type: string(),

	/**
	 * Non-empty array of authority identifiers.
	 */
	values: pipe(array(string()), nonEmpty()),
});

/**
 * Credential Query - requests a presentation of one or more matching Credentials.
 *
 * @see https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6.1
 */
export type DCQLCredentialQuery = InferInput<typeof DCQLCredentialQuerySchema>;
export const DCQLCredentialQuerySchema = object({
	/**
	 * Required. Unique identifier for the credential in the response.
	 */
	id: string(),

	/**
	 * Required. Credential format (e.g., "dc+sd-jwt", "mso_mdoc", "jwt_vc_json").
	 */
	format: string(),

	/**
	 * Optional. Whether multiple credentials can be returned. Default false.
	 */
	multiple: optional(boolean()),

	/**
	 * Required. Format-specific metadata (e.g., vct_values for SD-JWT, doctype_value for mdoc).
	 */
	meta: object({
		/**
		 * SD-JWT VC: allowed type identifiers.
		 */
		vct_values: optional(pipe(array(string()), nonEmpty())),

		/**
		 * mdoc: allowed doctype value.
		 */
		doctype_value: optional(string()),

		/**
		 * W3C VC: allowed type values.
		 */
		type_values: optional(array(pipe(array(string()), nonEmpty()))),
	}),

	/**
	 * Optional. Expected authorities or trust frameworks.
	 */
	trusted_authorities: optional(pipe(array(DCQLTrustedAuthoritySchema), nonEmpty())),

	/**
	 * Optional. Whether cryptographic holder binding is required. Default true.
	 */
	require_cryptographic_holder_binding: optional(boolean()),

	/**
	 * Optional. Claims to request from the Credential.
	 */
	claims: optional(pipe(array(DCQLClaimsQuerySchema), nonEmpty())),

	/**
	 * Optional. Combinations of claim IDs that satisfy the request.
	 */
	claim_sets: optional(pipe(array(pipe(array(string()), nonEmpty())), nonEmpty())),
});

/**
 * Credential Set Query - specifies constraints on which credentials to return.
 *
 * @see https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6.2
 */
export type DCQLCredentialSetQuery = InferInput<typeof DCQLCredentialSetQuerySchema>;
export const DCQLCredentialSetQuerySchema = object({
	/**
	 * Required. Each element is a list of credential IDs that satisfies the use case.
	 */
	options: pipe(array(pipe(array(string()), nonEmpty())), nonEmpty()),

	/**
	 * Optional. Whether this credential set is required. Default true.
	 */
	required: optional(boolean()),
});

/**
 * DCQL Query - Digital Credentials Query Language.
 *
 * @see https://openid.net/specs/openid-4-verifiable-presentations-1_0.html#section-6
 */
export type DCQLQuery = InferInput<typeof DCQLQuerySchema>;
export const DCQLQuerySchema = object({
	/**
	 * Required. Credential queries specifying the requested credentials.
	 */
	credentials: pipe(array(DCQLCredentialQuerySchema), nonEmpty()),

	/**
	 * Optional. Additional constraints on which credentials to return.
	 */
	credential_sets: optional(pipe(array(DCQLCredentialSetQuerySchema), nonEmpty())),
});
