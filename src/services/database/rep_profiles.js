import { getDB } from './client';

export const ProfileRepository = {
    saveProfile: async (profile) => {
        const db = await getDB();
        try {
            await db.withTransactionAsync(async () => {
                await db.runAsync(
                    `INSERT OR REPLACE INTO profiles (id, name, type, gender, birth_date, birth_time, lat, lng, location_name, is_time_unknown, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                    [
                        profile.id,
                        profile.name,
                        profile.type,
                        profile.gender || null,
                        profile.birthDate,
                        profile.birthTime,
                        profile.birthLocation.lat,
                        profile.birthLocation.lng,
                        profile.birthLocation.name,
                        profile.isTimeUnknown ? 1 : 0,
                        Date.now()
                    ]
                );

                if (profile.chart) {
                    await db.runAsync(
                        `INSERT OR REPLACE INTO charts (id, planets, aspects, houses, elements, modalities, calculated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?);`,
                        [
                            profile.id,
                            JSON.stringify(profile.chart.planets),
                            JSON.stringify(profile.chart.aspects),
                            JSON.stringify(profile.chart.houses),
                            JSON.stringify(profile.chart.elements),
                            JSON.stringify(profile.chart.modalities),
                            Date.now()
                        ]
                    );
                }

                await db.runAsync(`DELETE FROM reports WHERE profile_id = ?;`, [profile.id]);
                await db.runAsync(`DELETE FROM reports WHERE type = 'compatibility' AND (id LIKE ? OR id LIKE ?);`, [`%_${profile.id}`, `${profile.id}_%`]);
            });
            console.log(`[SQLite] Saved profile: ${profile.id}`);
        } catch (e) {
            console.error(`[SQLite] Failed to save profile ${profile.id}`, e);
            throw e;
        }
    },

    getAllProfiles: async () => {
        const db = await getDB();
        const rows = await db.getAllAsync(`
            SELECT p.*, c.planets, c.aspects, c.houses, c.elements, c.modalities
            FROM profiles p
            LEFT JOIN charts c ON p.id = c.id;
        `);

        return rows.map(row => ({
            id: row.id,
            name: row.name,
            type: row.type,
            gender: row.gender,
            birthDate: row.birth_date,
            birthTime: row.birth_time,
            birthLocation: { name: row.location_name, lat: row.lat, lng: row.lng },
            isTimeUnknown: row.is_time_unknown === 1,
            chart: row.planets ? {
                planets: JSON.parse(row.planets),
                aspects: JSON.parse(row.aspects),
                houses: JSON.parse(row.houses),
                elements: row.elements ? JSON.parse(row.elements) : { fire: 0, earth: 0, air: 0, water: 0 },
                modalities: row.modalities ? JSON.parse(row.modalities) : { cardinal: 0, fixed: 0, mutable: 0 }
            } : null
        }));
    },

    getProfileById: async (id) => {
        const db = await getDB();
        const row = await db.getFirstAsync(`
            SELECT p.*, c.planets, c.aspects, c.houses, c.elements, c.modalities
            FROM profiles p
            LEFT JOIN charts c ON p.id = c.id
            WHERE p.id = ?;
        `, [id]);

        if (!row) return null;
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            gender: row.gender,
            birthDate: row.birth_date,
            birthTime: row.birth_time,
            birthLocation: { name: row.location_name, lat: row.lat, lng: row.lng },
            isTimeUnknown: row.is_time_unknown === 1,
            chart: row.planets ? {
                planets: JSON.parse(row.planets),
                aspects: JSON.parse(row.aspects),
                houses: JSON.parse(row.houses),
                elements: row.elements ? JSON.parse(row.elements) : { fire: 0, earth: 0, air: 0, water: 0 },
                modalities: row.modalities ? JSON.parse(row.modalities) : { cardinal: 0, fixed: 0, mutable: 0 }
            } : null
        };
    },

    deleteProfile: async (id) => {
        const db = await getDB();
        await db.runAsync(`DELETE FROM profiles WHERE id = ?;`, [id]);
        console.log(`[SQLite] Deleted profile: ${id}`);
    },

    factoryReset: async () => {
        const db = await getDB();
        await db.runAsync('PRAGMA foreign_keys = OFF;');
        try {
            await db.withTransactionAsync(async () => {
                await db.runAsync(`DELETE FROM chat_messages;`);
                await db.runAsync(`DELETE FROM chat_sessions;`);
                await db.runAsync(`DELETE FROM forecasts;`);
                await db.runAsync(`DELETE FROM reports;`);
                await db.runAsync(`DELETE FROM charts;`);
                await db.runAsync(`DELETE FROM profiles;`);
            });
            console.log(`[SQLite] Factory Reset Complete`);
        } finally {
            await db.runAsync('PRAGMA foreign_keys = ON;');
        }
    }
};
