export const mockReqBody = [
	{
		name: 'John Smith',
		age: 35,
		address: {
			street: '123 Main St',
			city: 'Anytown',
			state: 'CA',
			zip: '12345'
		},
		phone_numbers: [
			{
				type: 'home',
				number: '555-1234'
			},
			{
				type: 'work',
				number: '555-5678'
			}
		],
		email: 'john.smith@example.com'
	},
	{
		name: 'John Doe',
		email: 'johndoe@example.com',
		age: 30,
		address: {
			street: '123 Main St',
			city: 'Anytown',
			state: 'CA',
			zip: '12345'
		},
		interests: [
			'hiking',
			'reading',
			'traveling'
		]
	},
	{
		a: 1,
		b: 2
	}
];
