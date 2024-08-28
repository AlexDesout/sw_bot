const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const api = require('../../utils/apiInstance');

// Fonction pour générer un ID unique
function generateUniqueId() {
    return `category_select_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('prediction')
        .setDescription('Predict which player will be the next to have luck in a specific category.')
        .addUserOption(option =>
            option.setName('player')
                .setDescription('The name of the player you think will have luck')
                .setRequired(true)),
    async execute(interaction) {
        const targetPlayer = interaction.options.getUser('player');
        const userId = interaction.user.id;
        const username = interaction.user.username;

        try {
            // Récupérer les catégories depuis l'API
            const categories = await api.get('/api/categories');

            if (!categories || categories.data.length === 0) {
                await interaction.reply({
                    content: 'No categories available for prediction.',
                    ephemeral: true
                });
                return;
            }

            // Construire un menu déroulant avec les catégories
            const options = categories.data.map(category => ({
                label: String(category.name),
                value: String(category.id)
            }));

            // Créer une correspondance entre ID et labels
            const idToLabelMap = options.reduce((acc, option) => {
                acc[option.value] = option.label;
                return acc;
            }, {});

            const uniqueId = generateUniqueId();

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(uniqueId)
                        .setPlaceholder('Choose a category')
                        .addOptions(options)
                );

            // Répondre initialement avec le choix du joueur
            await interaction.reply({
                content: `You selected ${targetPlayer}. Now, choose a category:`,
                components: [row],
                ephemeral: true
            });

            // Gestion de l'événement après la sélection de la catégorie
            const filter = i => i.customId === uniqueId && i.user.id === userId;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 10000 });

            collector.on('collect', async i => {
                const selectedCategory = i.values[0];
                const selectedLabel = idToLabelMap[selectedCategory];

                try {
                    // Appel à l'API pour ajouter la prédiction
                    await api.post("/api/predictions", {
                        player_id: userId, // ID de l'utilisateur qui fait la prédiction
                        user_id: targetPlayer.id, // ID du joueur prédit
                        category_id: selectedCategory,
                        username: username
                    });

                    // Si la réponse de l'API ne contient pas d'erreur, mettre à jour le message
                    await i.update({
                        content: `Prediction confirmed! <@${userId}> thinks ${targetPlayer.username} will be the next to have luck in category "${selectedLabel}" 🍀.`,
                        components: [],
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('Error adding prediction:', error);
                    try {
                        await i.update({
                            content: `❌ ${error.response?.data?.error || 'An error occurred while processing your prediction.'}`,
                            components: [],
                            ephemeral: true
                        });
                    } catch (updateError) {
                        console.error('Error updating interaction:', updateError);
                    }
                }
            });

            collector.on('end', collected => {
                if (collected.size === 0) {
                    try {
                        interaction.followUp({
                            content: 'Time expired! Please try again.',
                            ephemeral: true
                        });
                    } catch (followUpError) {
                        console.error('Error sending follow-up message:', followUpError);
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching categories:', error);
            try {
                await interaction.reply({
                    content: 'An error occurred while fetching the categories.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Error sending error message:', replyError);
            }
        }
    },
};