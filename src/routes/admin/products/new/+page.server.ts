import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { productSchema } from '$lib/schemas/product.schema';
import type { Currency } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	const { commercify } = locals;

	try {
		// Initialize the form with default values
		const form = await superValidate(zod(productSchema));

		// Get available currencies for the form
		const [currenciesResult, categoriesResult] = await Promise.allSettled([
			commercify.currencies.list(),
			commercify.categories.list()
		]);

		if (currenciesResult.status === 'rejected' || categoriesResult.status === 'rejected') {
			console.error('Failed to fetch currencies or categories');
			return fail(500, {
				form,
				message: 'Failed to load currencies or categories. Please try again later.'
			});
		}

		const currencies = currenciesResult.value;
		const categories = categoriesResult.value;

		if (!currencies || !categories) {
			console.error('Failed to fetch currencies or categories');
			return fail(500, {
				form,
				message: 'Failed to load currencies or categories. Please try again later.'
			});
		}

		if (!currencies.success) {
			console.error('Failed to fetch currencies:', currencies.error);
			return fail(500, {
				form,
				message: 'Failed to load currencies. Please try again later.'
			});
		}

		if (!categories.success) {
			console.error('Failed to fetch categories:', categories.error);
			return fail(500, {
				form,
				message: 'Failed to load categories. Please try again later.'
			});
		}

		form.data.currency = currencies.data.find((currency: Currency) => currency.isDefault)!.code;

		return {
			form,
			currencies: currencies.success ? currencies.data : [],
			categories: categories.success ? categories.data : []
		};
	} catch (error) {
		console.error('Error loading new product page:', error);
		const form = await superValidate(zod(productSchema));
		return {
			form,
			currencies: [],
			categories: []
		};
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { commercify } = locals;
		const form = await superValidate(request, zod(productSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const result = await commercify.products.create(form.data);

		if (!result.success || !result.data) {
			return fail(400, {
				form,
				message: result.error || 'Failed to create product'
			});
		}

		throw redirect(303, `/admin/products/${result.data.id.toString()}`);
	}
};
