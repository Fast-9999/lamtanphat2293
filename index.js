const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json()); // Giúp server đọc được data JSON gửi lên

// ================= 1. ĐỊNH NGHĨA MODEL (SCHEMA) =================

// Schema cho Role
const roleSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    description: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false } // Trường này để phục vụ "xoá mềm"
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);

// Schema cho User
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    fullName: { type: String, default: "" },
    avatarUrl: { type: String, default: "https://i.sstatic.net/l60Hf.png" },
    status: { type: Boolean, default: false },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    loginCount: { type: Number, default: 0, min: 0 },
    isDeleted: { type: Boolean, default: false } // Trường này để phục vụ "xoá mềm"
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// ================= 2. ĐỊNH NGHĨA CONTROLLER (CÁC HÀM XỬ LÝ) =================

// ---- A. CRUD CHO ROLE ----
const createRole = async (req, res) => {
    try {
        const newRole = await Role.create(req.body);
        res.status(201).json(newRole);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAllRoles = async (req, res) => {
    try {
        // Chỉ lấy những record chưa bị xoá mềm
        const roles = await Role.find({ isDeleted: false });
        res.status(200).json(roles);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getRoleById = async (req, res) => {
    try {
        const role = await Role.findOne({ _id: req.params.id, isDeleted: false });
        if (!role) return res.status(404).json({ message: "Not found" });
        res.status(200).json(role);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateRole = async (req, res) => {
    try {
        const role = await Role.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
        res.status(200).json(role);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const softDeleteRole = async (req, res) => {
    try {
        // Xoá mềm là update isDeleted thành true
        await Role.findByIdAndUpdate(req.params.id, { isDeleted: true });
        res.status(200).json({ message: "Xoá mềm Role thành công" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ---- B. CRUD CHO USER ----
const createUser = async (req, res) => {
    try {
        const newUser = await User.create(req.body);
        res.status(201).json(newUser);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ isDeleted: false }).populate('role');
        res.status(200).json(users);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, isDeleted: false }).populate('role');
        if (!user) return res.status(404).json({ message: "Not found" });
        res.status(200).json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateUser = async (req, res) => {
    try {
        const user = await User.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true });
        res.status(200).json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const softDeleteUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isDeleted: true });
        res.status(200).json({ message: "Xoá mềm User thành công" });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ---- C. ENABLE / DISABLE USER STATUS ----
const enableUser = async (req, res) => {
    try {
        const { email, username } = req.body;
        const user = await User.findOneAndUpdate(
            { email, username, isDeleted: false }, 
            { status: true }, 
            { new: true }
        );
        if (!user) return res.status(404).json({ message: "Sai email/username hoặc user không tồn tại" });
        res.status(200).json({ message: "Đã Enable (status: true)", user });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const disableUser = async (req, res) => {
    try {
        const { email, username } = req.body;
        const user = await User.findOneAndUpdate(
            { email, username, isDeleted: false }, 
            { status: false }, 
            { new: true }
        );
        if (!user) return res.status(404).json({ message: "Sai email/username hoặc user không tồn tại" });
        res.status(200).json({ message: "Đã Disable (status: false)", user });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ================= 3. ĐỊNH NGHĨA ROUTES (ĐƯỜNG DẪN API) =================

// Routes Role
app.post('/roles', createRole);
app.get('/roles', getAllRoles);
app.get('/roles/:id', getRoleById);
app.put('/roles/:id', updateRole);
app.delete('/roles/:id', softDeleteRole);

// Routes User
app.post('/users', createUser);
app.get('/users', getAllUsers);
app.get('/users/:id', getUserById);
app.put('/users/:id', updateUser);
app.delete('/users/:id', softDeleteUser);

// Routes Enable/Disable
app.post('/enable', enableUser);
app.post('/disable', disableUser);

// ================= 4. KẾT NỐI MONGODB & CHẠY SERVER =================
mongoose.connect('mongodb://127.0.0.1:27017/baitapmoi_db')
    .then(() => {
        console.log("🔥 Đã kết nối MongoDB thành công!");
        app.listen(3000, () => {
            console.log("🚀 Server chạy tại: http://localhost:3000");
        });
    })
    .catch(err => console.log("Lỗi kết nối DB:", err));