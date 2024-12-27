# House Buying calculator

This project is a small stand-alone calculator that tries to simulate:
- When, after today, you'll be able to afford a deposit for a house.
- How much you'll pay in rent and in total loan interest in the end.
- Your monthly payments for the mortgage
- What is the best time for you to buy a house, given your savings and expected costs.

It should be noted that it the most important factors are set by you:
- Target house price
- Bank interest rate
- Taxes on the purchase

It does so by calculating, for every month after today and until retirement:
- How much your savings increases up to that month
- It then calculates a mortgage taken out at that month
- And adds the rent you paid from now until then

The total cost (rent paid up to a given month and the interest on a loan taken then) is plotted on a graph so you see
the impact of variables like interest rate, taxes and rent cost.