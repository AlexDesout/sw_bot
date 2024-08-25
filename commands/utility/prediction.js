const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prediction')
        .setDescription('Predict which player will be the next to have luck in a specific category.')
        .addStringOption(option =>
            option.setName('player')
                .setDescription('The name of the player you think will have luck')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category of the prediction')
                .setRequired(true)
                .addChoices(
                    { name: 'Drop ld 5', value: 'ld_5' },
                    { name: 'Drop ld 5 dupe', value: 'ld_5_dupe' },
                    { name: 'Drop a quad speed roll', value: 'spd_roll' }
                    // { name: 'Defeating a boss', value: 'defeating_boss' }
                )),
    async execute(interaction) {
        const targetPlayer = interaction.options.getString('player');
        const category = interaction.options.getString('category');
        const userId = interaction.user.id;  // Récupérer l'ID de l'utilisateur

        // Répondre à l'utilisateur en mentionnant son nom
        await interaction.reply({
            content: `Prediction received 🔔 <@${userId}> thinks ${targetPlayer} will be the next to have luck in the category "${category}" 🍀.`,
            ephemeral: true // Non visible par tous
        });
    },
};