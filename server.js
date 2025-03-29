const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Добавлено хеширование
const app = express();

// Настройки
app.use(cors());
app.use(express.json());
const USERS_FILE = path.join(__dirname, 'users.json');
const SALT_ROUNDS = 10; // Для bcrypt

// Проверка и создание файла users.json
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]');
}

// Настройка транспорта для Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'stanislav888888888888@gmail.com',
        pass: 'ixhl fgjp nwsz xwig'
    }
});

// Регистрация пользователя
app.post('/register', async (req, res) => { // Добавлен async
    try {
        const { email, password } = req.body;

        // Валидация email
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Некорректный формат email'
            });
        }

        // Чтение пользователей
        const rawData = fs.readFileSync(USERS_FILE, 'utf-8');
        const users = JSON.parse(rawData);

        // Проверка существующего email
        if (users.some(u => u.email === email)) {
            return res.status(400).json({
                success: false,
                error: 'Пользователь уже существует'
            });
        }

        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // Сохранение пользователя
        users.push({ email, password: hashedPassword });
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));

        // Отправка письма
        const mailOptions = {
            from: 'stanislav888888888888@gmail.com',
            to: email,
            subject: 'Регистрация успешна',
            text: `Ваш email: ${email}`
        };

        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Ошибка отправки:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка отправки письма'
                });
            }
            res.json({ success: true });
        });

    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

// Восстановление пароля
app.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const rawData = fs.readFileSync(USERS_FILE, 'utf-8');
        const users = JSON.parse(rawData);
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Пользователь не найден'
            });
        }

        // Генерация временного пароля
        const tempPassword = Math.random().toString(36).slice(-8);
        const mailOptions = {
            from: 'stanislav888888888888@gmail.com',
            to: email,
            subject: 'Восстановление пароля',
            text: `Временный пароль: ${tempPassword}`
        };

        // Хеширование и сохранение
        const hashedPassword = await bcrypt.hash(tempPassword, SALT_ROUNDS);
        const updatedUsers = users.map(u => 
            u.email === email ? { ...u, password: hashedPassword } : u
        );
        fs.writeFileSync(USERS_FILE, JSON.stringify(updatedUsers, null, 2));

        // Отправка письма
        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.error('Ошибка отправки:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Ошибка отправки письма'
                });
            }
            res.json({ success: true });
        });

    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

// Запуск сервера
app.listen(3000, (error) => {
    if (error) {
        console.error('Ошибка запуска:', error);
    } else {
        console.log('Сервер запущен на порту 3000');
    }
});