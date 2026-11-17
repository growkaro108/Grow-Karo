
ALTER TABLE public.schemes
ADD COLUMN is_principal_include_on_maturity boolean DEFAULT true;

ALTER TABLE public.schemes_aud
ADD COLUMN is_principal_include_on_maturity boolean DEFAULT true;