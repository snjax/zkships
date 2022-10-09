const ModalController = {
    addClassName: 'modal-open',
    openList: new Set(),
    open(key) {
        this.openList.add(key)
        this.setModalOpen()
    },
    close(key) {
        this.openList.delete(key)
        this.setModalOpen()
    },
    setModalOpen() {
        if (this.openList.size) {
            if (!document.body.classList.contains(this.addClassName)) document.body.classList.add(this.addClassName)
        }
        else {
            document.body.classList.remove(this.addClassName)
        }
    }
}

export default ModalController
